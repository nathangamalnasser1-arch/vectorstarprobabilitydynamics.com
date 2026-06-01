package com.nathangamalnasser.natapps.recorder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Binder
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class RecordingService : Service(), SensorEventListener {

    companion object {
        private const val CHANNEL_ID = "rec_channel"
        private const val NOTIF_ID   = 1
        private const val SAMPLE_INTERVAL_MS = 20L  // 50 Hz
    }

    // ── Binder for Activity ──────────────────────────────────────────────────

    inner class LocalBinder : Binder() {
        fun get(): RecordingService = this@RecordingService
    }
    private val binder = LocalBinder()
    override fun onBind(intent: Intent?): IBinder = binder

    // ── Public state ─────────────────────────────────────────────────────────

    enum class RecState { IDLE, RECORDING }

    var recState  = RecState.IDLE; private set
    var deviceSide = "left"

    var onStateChanged:  ((RecState) -> Unit)?        = null
    var onTimerTick:     ((Long, Int, Double) -> Unit)? = null  // elapsedMs, sampleCount, peakAccel
    var onSensorUpdate:  ((Float, Float, Float, Float, Float, Float) -> Unit)? = null  // ax..gz

    // ── Internals ─────────────────────────────────────────────────────────────

    private lateinit var sensorManager: SensorManager
    private var accelSensor: Sensor? = null
    private var gyroSensor:  Sensor? = null
    private lateinit var wakeLock: PowerManager.WakeLock

    // Latest raw readings
    @Volatile private var ax = 0f; @Volatile private var ay = 9.81f; @Volatile private var az = 0f
    @Volatile private var gx = 0f; @Volatile private var gy = 0f;    @Volatile private var gz = 0f

    private var startTime     = 0L
    private var lastSampleMs  = 0L
    private var peakAccel     = 0.0
    private var peakGyro      = 0.0

    // localSamples is built in sensor callback (may run on sensor thread — use synchronized list)
    private val localSamples  = Collections.synchronizedList(mutableListOf<JSONObject>())
    private val remoteSamples = Collections.synchronizedList(mutableListOf<JSONObject>())

    private val scope    = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var timerJob: Job? = null

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        accelSensor   = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroSensor    = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NatappsRecorder:WL")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
        scope.cancel()
    }

    // ── Recording control ─────────────────────────────────────────────────────

    fun startRecording() {
        if (recState == RecState.RECORDING) return
        recState    = RecState.RECORDING
        startTime   = System.currentTimeMillis()
        lastSampleMs = 0L
        peakAccel   = 0.0
        peakGyro    = 0.0
        localSamples.clear()
        remoteSamples.clear()

        if (!wakeLock.isHeld) wakeLock.acquire(6 * 60 * 60 * 1000L) // max 6 h

        sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_GAME)
        sensorManager.registerListener(this, gyroSensor,  SensorManager.SENSOR_DELAY_GAME)

        startForeground(NOTIF_ID, buildNotif("● Recording…  00:00"))

        timerJob = scope.launch {
            while (recState == RecState.RECORDING) {
                delay(1000)
                val elapsed = System.currentTimeMillis() - startTime
                val min = elapsed / 60000
                val sec = (elapsed / 1000) % 60
                val txt = "● Recording…  %02d:%02d".format(min, sec)
                updateNotif(txt)
                withContext(Dispatchers.Main) {
                    onTimerTick?.invoke(elapsed, localSamples.size, peakAccel)
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
        if (wakeLock.isHeld) wakeLock.release()
        saveSession()
        stopForeground(STOP_FOREGROUND_REMOVE)
        onStateChanged?.invoke(recState)
    }

    // ── Remote sample ingestion (from BT, called on main thread) ────────────

    fun addRemoteSample(json: String) {
        try { remoteSamples.add(JSONObject(json)) } catch (_: Exception) {}
    }

    // ── Session persistence ───────────────────────────────────────────────────

    private fun saveSession() {
        val duration = System.currentTimeMillis() - startTime
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            .also { it.timeZone = TimeZone.getTimeZone("UTC") }
            .format(Date(startTime))

        val sessions = JSONArray()
        sessions.put(buildSessionJson(deviceSide, localSamples, duration, iso))
        if (remoteSamples.isNotEmpty()) {
            val other = if (deviceSide == "left") "right" else "left"
            sessions.put(buildSessionJson(other, remoteSamples, duration, iso))
        }

        val file = File(filesDir, "session_${startTime}.json")
        file.writeText(sessions.toString())
    }

    private fun buildSessionJson(
        side: String,
        samples: List<JSONObject>,
        duration: Long,
        iso: String
    ): JSONObject {
        val arr = JSONArray()
        samples.forEach { arr.put(it) }
        return JSONObject().apply {
            put("id", startTime)
            put("device", side)
            put("timestamp", iso)
            put("duration_ms", duration)
            put("peak_accel_ms2", peakAccel.round(3))
            put("peak_gyro_rads", peakGyro.round(4))
            put("sample_count", samples.size)
            put("samples", arr)
        }
    }

    fun getSessionFiles(): List<File> =
        filesDir.listFiles { f -> f.name.startsWith("session_") && f.name.endsWith(".json") }
            ?.sortedByDescending { it.name } ?: emptyList()

    fun deleteSession(file: File) { file.delete() }

    // ── Sensor callbacks ──────────────────────────────────────────────────────

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> { ax = event.values[0]; ay = event.values[1]; az = event.values[2] }
            Sensor.TYPE_GYROSCOPE     -> { gx = event.values[0]; gy = event.values[1]; gz = event.values[2] }
        }

        val now = System.currentTimeMillis()
        if (recState != RecState.RECORDING || now - lastSampleMs < SAMPLE_INTERVAL_MS) return
        lastSampleMs = now

        val dax = ax.toDouble(); val day = ay.toDouble(); val daz = az.toDouble()
        val dgx = gx.toDouble(); val dgy = gy.toDouble(); val dgz = gz.toDouble()
        val accelMag = Math.sqrt(dax*dax + day*day + daz*daz)
        val gyroMag  = Math.sqrt(dgx*dgx + dgy*dgy + dgz*dgz)

        if (accelMag > peakAccel) peakAccel = accelMag
        if (gyroMag  > peakGyro)  peakGyro  = gyroMag

        val sample = JSONObject().apply {
            put("t", now - startTime)
            put("ax", dax.round(3)); put("ay", day.round(3)); put("az", daz.round(3))
            put("gx", dgx.round(4)); put("gy", dgy.round(4)); put("gz", dgz.round(4))
            put("accel_mag", accelMag.round(3))
            put("gyro_mag",  gyroMag.round(4))
        }
        localSamples.add(sample)

        // Notify activity to forward sample to BT peer
        sampleReadyCallback?.invoke(sample.toString())

        // Update live UI (best-effort, drop if main thread is busy)
        scope.launch(Dispatchers.Main) {
            onSensorUpdate?.invoke(ax, ay, az, gx, gy, gz)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    /** Set by Activity to forward samples to BluetoothController */
    var sampleReadyCallback: ((String) -> Unit)? = null

    // ── Notification helpers ──────────────────────────────────────────────────

    private fun createNotificationChannel() {
        val ch = NotificationChannel(CHANNEL_ID, "Sensor Recording", NotificationManager.IMPORTANCE_LOW)
        ch.description = "Active while recording motion data"
        getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }

    private fun buildNotif(text: String): Notification {
        val pi = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Natapps Recorder")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_record)
            .setContentIntent(pi)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun updateNotif(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotif(text))
    }
}

private fun Double.round(d: Int): Double {
    val f = Math.pow(10.0, d.toDouble())
    return Math.round(this * f) / f
}
