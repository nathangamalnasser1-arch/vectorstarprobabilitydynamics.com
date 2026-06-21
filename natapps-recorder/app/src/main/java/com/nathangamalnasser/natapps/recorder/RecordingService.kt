package com.nathangamalnasser.natapps.recorder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Binder
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.Inet4Address
import java.net.NetworkInterface
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.atomic.AtomicBoolean

class RecordingService : Service(), SensorEventListener {

    companion object {
        private const val CHANNEL_ID  = "rec_channel"
        private const val NOTIF_ID    = 1
        private const val SAMPLE_MS   = 20L   // 50 Hz
        private const val ROUND_SECS  = 180L  // 3-minute boxing round
        private const val RTDB_HZ_MS  = 100L  // write live data at 10 Hz

        // UIS calibration (raw score → 0–1000)
        private const val UIS_MAX_BOXING      = 200.0
        private const val UIS_MAX_ROLLERBLADE = 100.0
        private const val UIS_WA_BOXING       = 0.65
        private const val UIS_WG_BOXING       = 0.35
        private const val UIS_WA_ROLLER       = 0.45
        private const val UIS_WG_ROLLER       = 0.55
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    /** "sensor1" = Phone 1 (IMU + Nearby advertise)
     *  "hub"     = Phone 2 (IMU + Nearby receive + Firebase write)
     *  "cam"     = Phone 3 (video only — handled by CamService) */
    var role = "sensor1"

    // ── Binder ────────────────────────────────────────────────────────────────

    inner class LocalBinder : Binder() { fun get() = this@RecordingService }
    private val binder = LocalBinder()
    override fun onBind(intent: Intent?): IBinder = binder

    // ── State ─────────────────────────────────────────────────────────────────

    enum class RecState { IDLE, RECORDING }

    var recState   = RecState.IDLE; private set
    var deviceSide = "left"
    var appMode    = "rollerblade"  // "rollerblade" or "boxing"
    var sessionName = ""

    var onStateChanged: ((RecState) -> Unit)?                                 = null
    var onTimerTick:    ((Long, Int, Double) -> Unit)?                        = null
    var onSensorUpdate: ((Float, Float, Float, Float, Float, Float) -> Unit)? = null
    var onPeerState:    ((PeerJSClient.State, String) -> Unit)?               = null
    var onNearbyState:  ((String) -> Unit)?                                   = null
    var onFirebaseState:((String) -> Unit)?                                   = null
    var onGyroStatus:   ((Boolean) -> Unit)?                                  = null
    var onGpsStatus:    ((Boolean, Int) -> Unit)?                             = null
    var onRoundTick:    ((Int, Long) -> Unit)?                                = null

    // ── Internals ─────────────────────────────────────────────────────────────

    private lateinit var sensorManager:   SensorManager
    private var accelSensor: Sensor?    = null
    private var gyroSensor:  Sensor?    = null
    private lateinit var wakeLock:        PowerManager.WakeLock
    private lateinit var locationManager: LocationManager
    private lateinit var peerClient:      PeerJSClient
    private lateinit var relayServer:     RelayServer

    // Nearby
    private var nearbyTransport: NearbyTransport? = null
    private var nearbyReceiver:  NearbyReceiver?  = null

    fun isNearbyAdvertising() = nearbyTransport != null
    fun isNearbyDiscovering()  = nearbyReceiver  != null

    // Firebase (hub role)
    private var hubWriter: FirebaseHubWriter? = null

    @Volatile private var ax = 0f; @Volatile private var ay = 9.81f; @Volatile private var az = 0f
    @Volatile private var gx = 0f; @Volatile private var gy = 0f;    @Volatile private var gz = 0f

    private var startTime    = 0L
    private var lastSampleMs = 0L
    private var lastRtdbMs   = 0L
    private var lastRemoteRtdbMs = 0L
    private var peakAccel    = 0.0
    private var peakGyro     = 0.0

    private var gyroSampleCount  = 0
    private var gyroNonZeroCount = 0
    private val gyroStatusFired  = AtomicBoolean(false)

    private val localSamples = Collections.synchronizedList(mutableListOf<JSONObject>())
    private val gpsTrack     = Collections.synchronizedList(mutableListOf<JSONObject>())
    private var gpsFixCount  = 0
    private var gpsRegistered   = false
    private var gpsOriginSent   = false
    private var remoteCount     = 0

    // Boxing
    private var roundNumber   = 0
    private var roundSecsLeft = 0L
    private val roundEvents   = Collections.synchronizedList(mutableListOf<JSONObject>())

    private val scope    = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var timerJob: Job? = null

    // ── GPS listener ──────────────────────────────────────────────────────────

    private val gpsListener = object : LocationListener {
        override fun onLocationChanged(loc: Location) {
            if (recState != RecState.RECORDING) return
            gpsFixCount++
            val t = System.currentTimeMillis() - startTime
            gpsTrack.add(JSONObject().apply {
                put("t",   t); put("lat", loc.latitude); put("lng", loc.longitude)
                put("alt", loc.altitude.round(1)); put("acc", loc.accuracy.toDouble().round(1))
            })
            if (!gpsOriginSent) {
                gpsOriginSent = true
                peerClient.sendGpsOrigin(loc.latitude, loc.longitude)
            }
            peerClient.sendGps(t, loc.latitude, loc.longitude, loc.altitude, loc.accuracy)
            scope.launch(Dispatchers.Main) { onGpsStatus?.invoke(true, gpsFixCount) }
        }
        @Deprecated("Deprecated in Java")
        override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        sensorManager   = getSystemService(SENSOR_SERVICE) as SensorManager
        accelSensor     = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroSensor      = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NatappsRecorder:WL")

        peerClient = PeerJSClient(this)
        peerClient.onStateChange = { state, msg -> onPeerState?.invoke(state, msg) }
        peerClient.onRemoteStart = { name ->
            if (recState != RecState.RECORDING) {
                scope.launch(Dispatchers.Main) { startRecording(name) }
            }
        }

        relayServer = RelayServer(this)
        relayServer.start()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
        peerClient.disconnect()
        relayServer.stop()
        nearbyTransport?.stop()
        nearbyReceiver?.stop()
        scope.cancel()
    }

    // ── Nearby setup ──────────────────────────────────────────────────────────

    fun startNearbyAdvertising() {
        val nt = NearbyTransport(this)
        nearbyTransport = nt
        nt.onStatusChange = { msg ->
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke(msg) }
        }
        nt.onConnected = {
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke("HUB connected ●") }
        }
        nt.onDisconnected = {
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke("HUB disconnected") }
        }
        nt.onCommandReceived = { json ->
            try {
                val obj = JSONObject(json)
                if (obj.optString("type") == "cmd" && obj.optString("action") == "start") {
                    if (recState != RecState.RECORDING) {
                        scope.launch(Dispatchers.Main) { startRecording(obj.optString("session", "")) }
                    }
                }
            } catch (_: Exception) {}
        }
        nt.startAdvertising(deviceSide)
    }

    fun startNearbyDiscovery() {
        val nr = NearbyReceiver(this)
        nearbyReceiver = nr
        nr.onStatusChange = { msg ->
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke(msg) }
        }
        nr.onConnected = {
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke("SENSOR 1 connected ●") }
        }
        nr.onDisconnected = {
            scope.launch(Dispatchers.Main) { onNearbyState?.invoke("SENSOR 1 disconnected") }
        }
        nr.onDataReceived = { bytes ->
            if (recState == RecState.RECORDING) {
                try {
                    val obj  = JSONObject(String(bytes))
                    val side = obj.optString("device", "left")
                    remoteCount++
                    val now = System.currentTimeMillis()
                    if (now - lastRemoteRtdbMs >= RTDB_HZ_MS) {
                        lastRemoteRtdbMs = now
                        hubWriter?.writeSample(side, obj)
                    }
                } catch (_: Exception) {}
            }
        }
        nr.startDiscovering()
    }

    fun stopNearby() {
        nearbyTransport?.stop(); nearbyTransport = null
        nearbyReceiver?.stop();  nearbyReceiver  = null
    }

    // ── Viewer connection (relay fallback) ────────────────────────────────────

    fun connectToViewer(ip: String) { peerClient.connect(ip, deviceSide) }
    fun disconnectFromViewer()      { peerClient.disconnect() }
    fun isPeerConnected()           = peerClient.isConnected()
    fun sendStartCommand(name: String) {
        peerClient.sendStartCommand(name)
        // Also tell SENSOR 1 via Nearby (hub role)
        nearbyReceiver?.sendToSensor(
            JSONObject().apply { put("type","cmd"); put("action","start"); put("session",name) }.toString()
        )
    }

    // ── Recording ─────────────────────────────────────────────────────────────

    fun getLocalIp(): String =
        runCatching {
            NetworkInterface.getNetworkInterfaces()?.toList()
                ?.flatMap { it.inetAddresses.toList() }
                ?.firstOrNull { !it.isLoopbackAddress && it is Inet4Address }
                ?.hostAddress
        }.getOrNull() ?: "?"

    fun startRecording(name: String = "", presetSessionId: Long = 0L) {
        if (recState == RecState.RECORDING) return
        sessionName = name

        if (!peerClient.isConnected()) peerClient.connect("localhost", deviceSide)

        val sid = if (presetSessionId > 0L) presetSessionId else System.currentTimeMillis()

        // Firebase RTDB writer (hub role only — requires google-services.json)
        if (role == "hub") {
            try {
                val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
                startTime = sid
                hubWriter = FirebaseHubWriter(sid, uid, appMode)
                hubWriter?.writeSessionStart()
                scope.launch(Dispatchers.Main) { onFirebaseState?.invoke("Firebase: recording ●") }
            } catch (e: Exception) {
                startTime = sid
                scope.launch(Dispatchers.Main) { onFirebaseState?.invoke("Firebase: not configured") }
            }
        } else {
            startTime = sid
        }

        recState         = RecState.RECORDING
        lastSampleMs     = 0L
        lastRtdbMs       = 0L
        lastRemoteRtdbMs = 0L
        peakAccel        = 0.0
        peakGyro         = 0.0
        gyroSampleCount  = 0
        gyroNonZeroCount = 0
        gyroStatusFired.set(false)
        gpsOriginSent    = false
        remoteCount      = 0
        localSamples.clear()
        gpsTrack.clear()
        gpsFixCount   = 0
        roundNumber   = 0
        roundSecsLeft = 0L
        roundEvents.clear()

        if (!wakeLock.isHeld) wakeLock.acquire(6 * 60 * 60 * 1000L)

        sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_GAME)
        sensorManager.registerListener(this, gyroSensor,  SensorManager.SENSOR_DELAY_GAME)

        if (appMode != "boxing" && ContextCompat.checkSelfPermission(this,
                android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER, 1000L, 1f, gpsListener, mainLooper)
            gpsRegistered = true
            scope.launch(Dispatchers.Main) { onGpsStatus?.invoke(false, 0) }
        }

        startForeground(NOTIF_ID, buildNotif("● Recording…  00:00"))

        timerJob = scope.launch {
            while (recState == RecState.RECORDING) {
                delay(1000)
                val elapsed = System.currentTimeMillis() - startTime
                val min = elapsed / 60000; val sec = (elapsed / 1000) % 60
                updateNotif("● Recording…  %02d:%02d".format(min, sec))
                withContext(Dispatchers.Main) { onTimerTick?.invoke(elapsed, localSamples.size, peakAccel) }

                if (appMode == "boxing") {
                    if (roundNumber == 0) {
                        roundNumber   = 1
                        roundSecsLeft = ROUND_SECS
                        peerClient.sendRoundStart(1, elapsed)
                        roundEvents.add(JSONObject().apply { put("round",1); put("t",elapsed); put("event","start") })
                    } else {
                        roundSecsLeft--
                        if (roundSecsLeft <= 0) {
                            peerClient.sendRoundEnd(roundNumber, elapsed)
                            roundEvents.add(JSONObject().apply { put("round",roundNumber); put("t",elapsed); put("event","end") })
                            roundNumber++
                            roundSecsLeft = ROUND_SECS
                            peerClient.sendRoundStart(roundNumber, elapsed)
                            roundEvents.add(JSONObject().apply { put("round",roundNumber); put("t",elapsed); put("event","start") })
                        }
                    }
                    val r = roundNumber; val s = roundSecsLeft
                    withContext(Dispatchers.Main) { onRoundTick?.invoke(r, s) }
                }
            }
        }
        onStateChanged?.invoke(recState)
    }

    fun stopRecording() {
        if (recState != RecState.RECORDING) return
        recState = RecState.IDLE
        timerJob?.cancel()
        sensorManager.unregisterListener(this)
        if (gpsRegistered) {
            try { locationManager.removeUpdates(gpsListener) } catch (_: Exception) {}
            gpsRegistered = false
        }
        if (wakeLock.isHeld) wakeLock.release()

        // UIS + Firebase session close (hub role)
        if (role == "hub") {
            val duration = System.currentTimeMillis() - startTime
            val (uisRaw, uisScore) = computeUis(duration)
            hubWriter?.writeSessionEnd(duration, uisRaw, uisScore, localSamples.size, remoteCount)
            hubWriter = null
            scope.launch(Dispatchers.Main) { onFirebaseState?.invoke("Firebase: session saved (UIS $uisScore)") }
        }

        saveSession()
        stopForeground(STOP_FOREGROUND_REMOVE)
        onStateChanged?.invoke(recState)
    }

    private fun computeUis(durationMs: Long): Pair<Double, Int> {
        val wa  = if (appMode == "boxing") UIS_WA_BOXING else UIS_WA_ROLLER
        val wg  = if (appMode == "boxing") UIS_WG_BOXING else UIS_WG_ROLLER
        val max = if (appMode == "boxing") UIS_MAX_BOXING else UIS_MAX_ROLLERBLADE
        val durationS = durationMs / 1000.0
        val sumAccel  = synchronized(localSamples) {
            localSamples.sumOf { Math.abs(it.optDouble("accel_mag") - 9.81) }
        }
        val sumGyro   = synchronized(localSamples) {
            localSamples.sumOf { it.optDouble("gyro_mag") }
        }
        val raw   = if (durationS > 0) (sumAccel * wa + sumGyro * wg) / durationS else 0.0
        val score = (raw / max * 1000.0).coerceIn(0.0, 1000.0).toInt()
        return Pair(raw, score)
    }

    // ── Sensor callbacks ──────────────────────────────────────────────────────

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> { ax = event.values[0]; ay = event.values[1]; az = event.values[2] }
            Sensor.TYPE_GYROSCOPE -> {
                gx = event.values[0]; gy = event.values[1]; gz = event.values[2]
                if (!gyroStatusFired.get()) {
                    gyroSampleCount++
                    if (gx != 0f || gy != 0f || gz != 0f) gyroNonZeroCount++
                    if (gyroSampleCount >= 60 && gyroStatusFired.compareAndSet(false, true)) {
                        val working = gyroNonZeroCount >= 5
                        scope.launch(Dispatchers.Main) { onGyroStatus?.invoke(working) }
                    }
                }
            }
        }

        val now = System.currentTimeMillis()
        if (recState != RecState.RECORDING || now - lastSampleMs < SAMPLE_MS) return
        lastSampleMs = now

        val dax = ax.toDouble(); val day = ay.toDouble(); val daz = az.toDouble()
        val dgx = gx.toDouble(); val dgy = gy.toDouble(); val dgz = gz.toDouble()
        val accelMag = Math.sqrt(dax*dax + day*day + daz*daz)
        val gyroMag  = Math.sqrt(dgx*dgx + dgy*dgy + dgz*dgz)

        if (accelMag > peakAccel) peakAccel = accelMag
        if (gyroMag  > peakGyro)  peakGyro  = gyroMag

        val sample = JSONObject().apply {
            put("t",         now - startTime)
            put("ax",        dax.round(3)); put("ay", day.round(3)); put("az", daz.round(3))
            put("gx",        dgx.round(4)); put("gy", dgy.round(4)); put("gz", dgz.round(4))
            put("accel_mag", accelMag.round(3))
            put("gyro_mag",  gyroMag.round(4))
        }
        localSamples.add(sample)

        // Relay stream (WebSocket fallback)
        peerClient.send(sample.toString())

        // Nearby stream (sensor1 role → HUB)
        if (role == "sensor1" && nearbyTransport?.isConnected() == true) {
            val toSend = JSONObject(sample.toString()).apply { put("device", deviceSide) }
            nearbyTransport?.send(toSend.toString().toByteArray())
        }

        // Firebase RTDB live write at 10 Hz (hub role — own stream)
        if (role == "hub" && now - lastRtdbMs >= RTDB_HZ_MS) {
            lastRtdbMs = now
            hubWriter?.writeSample(deviceSide, sample)
        }

        scope.launch(Dispatchers.Main) { onSensorUpdate?.invoke(ax, ay, az, gx, gy, gz) }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    // ── Session persistence ───────────────────────────────────────────────────

    private fun saveSession() {
        val duration = System.currentTimeMillis() - startTime
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            .also { it.timeZone = TimeZone.getTimeZone("UTC") }.format(Date(startTime))

        val arr = JSONArray()
        synchronized(localSamples) { localSamples.forEach { arr.put(it) } }

        if (appMode == "boxing") {
            val roundArr = JSONArray()
            synchronized(roundEvents) { roundEvents.forEach { roundArr.put(it) } }
            val session = JSONObject().apply {
                put("format",         "boxing_session_v1")
                put("mode",           "boxing")
                put("id",             startTime)
                put("device",         deviceSide)
                put("role",           role)
                if (sessionName.isNotEmpty()) put("name", sessionName)
                put("timestamp",      iso)
                put("duration_ms",    duration)
                put("peak_accel_ms2", peakAccel.round(3))
                put("peak_gyro_rads", peakGyro.round(4))
                put("sample_count",   localSamples.size)
                put("rounds",         roundArr)
                put("samples",        arr)
            }
            File(filesDir, "boxing_session_${startTime}.json").writeText(JSONArray().put(session).toString())
        } else {
            val gpsArr = JSONArray()
            synchronized(gpsTrack) { gpsTrack.forEach { gpsArr.put(it) } }
            val session = JSONObject().apply {
                put("id",             startTime); put("device", deviceSide); put("role", role)
                if (sessionName.isNotEmpty()) put("name", sessionName)
                put("timestamp",      iso); put("duration_ms", duration)
                put("peak_accel_ms2", peakAccel.round(3)); put("peak_gyro_rads", peakGyro.round(4))
                put("sample_count",   localSamples.size); put("gps_count", gpsTrack.size)
                if (gpsTrack.isNotEmpty()) {
                    val first = synchronized(gpsTrack) { gpsTrack[0] }
                    put("gps_origin", JSONObject().apply {
                        put("lat", first.getDouble("lat")); put("lng", first.getDouble("lng"))
                    })
                }
                put("samples", arr); put("gps", gpsArr)
            }
            File(filesDir, "session_${startTime}.json").writeText(JSONArray().put(session).toString())
        }
    }

    fun getSessionFiles(): List<File> =
        filesDir.listFiles { f ->
            (f.name.startsWith("session_") || f.name.startsWith("boxing_session_")) && f.name.endsWith(".json")
        }?.sortedByDescending { it.name } ?: emptyList()

    fun deleteSession(file: File) { file.delete() }

    // ── Notification ──────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        val ch = NotificationChannel(CHANNEL_ID, "Sensor Recording", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }
    private fun buildNotif(text: String): Notification {
        val pi = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("APEX").setContentText(text)
            .setSmallIcon(R.drawable.ic_record)
            .setContentIntent(pi).setOngoing(true).setSilent(true).build()
    }
    private fun updateNotif(text: String) =
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotif(text))
}

private fun Double.round(d: Int): Double {
    val f = Math.pow(10.0, d.toDouble()); return Math.round(this * f) / f
}
