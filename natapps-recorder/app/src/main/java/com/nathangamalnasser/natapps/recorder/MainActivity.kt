package com.nathangamalnasser.natapps.recorder

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.nathangamalnasser.natapps.recorder.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var service: RecordingService? = null
    private var bound = false
    private var appMode = "rollerblade"
    private var role    = "sensor1"  // "sensor1" | "hub" | "cam"
    private var activeSessionId   = 0L
    private var activeSessionName = ""

    private val svcConn = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, b: IBinder) {
            service = (b as RecordingService.LocalBinder).get()
            bound   = true
            wireCallbacks()
            refreshUi()
        }
        override fun onServiceDisconnected(name: ComponentName) { bound = false; service = null }
    }

    private val permLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { granted ->
        // After permissions granted, re-activate Nearby if already in that role
        if (role == "sensor1" && service?.isNearbyAdvertising() == false) {
            service?.startNearbyAdvertising()
        } else if (role == "hub" && service?.isNearbyDiscovering() == false) {
            service?.startNearbyDiscovery()
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Auth gate — skip if guest mode or Firebase not configured
        if (!intent.getBooleanExtra("guest", false)) {
            try {
                if (FirebaseAuth.getInstance().currentUser == null) {
                    startActivity(Intent(this, LoginActivity::class.java))
                    finish(); return
                }
            } catch (_: Exception) { /* Firebase not configured, continue as guest */ }
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val intent = Intent(this, RecordingService::class.java)
        startService(intent)
        bindService(intent, svcConn, Context.BIND_AUTO_CREATE)

        setupClicks()
        setAppMode("rollerblade")
        setRole("sensor1")
        showUserInfo()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (bound) unbindService(svcConn)
    }

    // ── User info ─────────────────────────────────────────────────────────────

    private fun showUserInfo() {
        val user = try { FirebaseAuth.getInstance().currentUser } catch (_: Exception) { null }
        binding.tvUserInfo.text = user?.displayName?.takeIf { it.isNotEmpty() }
            ?: user?.email?.substringBefore('@') ?: "Guest"
    }

    // ── Service callbacks ─────────────────────────────────────────────────────

    private fun wireCallbacks() {
        val svc = service ?: return
        svc.onStateChanged = { runOnUiThread { refreshUi() } }
        svc.onTimerTick = { elapsed, count, peak ->
            runOnUiThread {
                val min = elapsed / 60000; val sec = (elapsed / 1000) % 60
                binding.tvTimer.text       = "%02d:%02d".format(min, sec)
                binding.tvSampleCount.text = "Samples: $count"
                binding.tvPeakAccel.text   = "Peak: ${"%.2f".format(peak / 9.81)}g"
            }
        }
        svc.onSensorUpdate = { ax, ay, az, gx, gy, gz ->
            runOnUiThread {
                binding.tvAx.text = "%.2f".format(ax); binding.tvAy.text = "%.2f".format(ay)
                binding.tvAz.text = "%.2f".format(az); binding.tvGx.text = "%.3f".format(gx)
                binding.tvGy.text = "%.3f".format(gy); binding.tvGz.text = "%.3f".format(gz)
            }
        }
        svc.onGyroStatus = { working ->
            runOnUiThread {
                if (working) {
                    binding.tvGyroStatus.text = "GYRO: OK  ●"
                    binding.tvGyroStatus.setTextColor(getColor(R.color.green))
                } else {
                    binding.tvGyroStatus.text = "GYRO: DEAD  ✕"
                    binding.tvGyroStatus.setTextColor(getColor(R.color.stop_red))
                }
            }
        }
        svc.onGpsStatus = { hasGps, count ->
            runOnUiThread {
                if (!hasGps) {
                    binding.tvGpsStatus.text = "GPS: waiting for fix…"
                    binding.tvGpsStatus.setTextColor(getColor(R.color.muted))
                } else {
                    binding.tvGpsStatus.text = "GPS: $count pts  ●"
                    binding.tvGpsStatus.setTextColor(getColor(R.color.green))
                }
            }
        }
        svc.onRoundTick = { round, secsLeft ->
            runOnUiThread {
                val m = secsLeft / 60; val s = secsLeft % 60
                binding.tvRoundInfo.text = "ROUND $round"
                binding.tvTimer.text     = "%d:%02d".format(m, s)
            }
        }
        svc.onPeerState = { state, msg ->
            runOnUiThread {
                binding.tvRelayStatus.text = when (state) {
                    PeerJSClient.State.CONNECTED  -> "Relay ●"
                    PeerJSClient.State.CONNECTING -> "Relay: connecting…"
                    PeerJSClient.State.ERROR      -> "Relay: $msg"
                    else                          -> "Relay: idle"
                }
                binding.btnConnect.text = if (state == PeerJSClient.State.CONNECTED ||
                    state == PeerJSClient.State.CONNECTING) "DISCONNECT" else "CONNECT"
            }
        }
        svc.onNearbyState = { msg ->
            runOnUiThread { binding.tvNearbyStatus.text = "Nearby: $msg" }
        }
        svc.onFirebaseState = { msg ->
            runOnUiThread { binding.tvFirebaseStatus.text = msg }
        }
        updateLiveUrl()
    }

    // ── Clicks ────────────────────────────────────────────────────────────────

    private fun setupClicks() {
        // Role buttons
        binding.btnRoleSensor1.setOnClickListener { setRole("sensor1") }
        binding.btnRoleHub.setOnClickListener     { setRole("hub") }
        binding.btnRoleCam.setOnClickListener     { setRole("cam") }

        // Sport mode
        binding.btnModeRollerblade.setOnClickListener { setAppMode("rollerblade") }
        binding.btnModeBoxing.setOnClickListener      { setAppMode("boxing") }

        // Device side
        binding.btnLeft.setOnClickListener  { setDeviceSide("left") }
        binding.btnRight.setOnClickListener { setDeviceSide("right") }

        // Relay fallback
        binding.btnConnect.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.isPeerConnected()) {
                svc.disconnectFromViewer()
            } else {
                val input = binding.etRelayUrl.text.toString().trim()
                svc.connectToViewer(input.ifEmpty { "localhost" })
            }
        }
        binding.etRelayUrl.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) { binding.btnConnect.performClick(); true }
            else false
        }

        // Record
        binding.btnRecord.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.recState == RecordingService.RecState.RECORDING) {
                svc.stopRecording()
            } else {
                val input = EditText(this).apply {
                    hint = "Session name (optional)"
                    setSingleLine(true); setPadding(48, 32, 48, 16)
                }
                AlertDialog.Builder(this)
                    .setTitle("New Session")
                    .setView(input)
                    .setPositiveButton("START") { _, _ ->
                        val name = input.text.toString().trim()
                        val sessionId = System.currentTimeMillis()
                        activeSessionId   = sessionId
                        activeSessionName = name
                        svc.appMode = appMode
                        svc.sendStartCommand(name)
                        svc.startRecording(name, sessionId)
                        if (role != "cam") showSessionQr(sessionId, name)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }

        binding.tvLiveUrl.setOnClickListener {
            if (activeSessionId > 0L) showSessionQr(activeSessionId, activeSessionName)
            else toast("Start a session first to get a QR code")
        }
        binding.btnSessions.setOnClickListener   { startActivity(Intent(this, SessionsActivity::class.java)) }
        binding.btnSocial.setOnClickListener     { startActivity(Intent(this, SocialFeedActivity::class.java)) }
        binding.btnChallenge.setOnClickListener  { startActivity(Intent(this, ChallengeActivity::class.java)) }
        binding.btnSignOut.setOnClickListener    {
            try { FirebaseAuth.getInstance().signOut() } catch (_: Exception) {}
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    // ── Role management ───────────────────────────────────────────────────────

    private fun setRole(r: String) {
        // Stop previous Nearby
        service?.stopNearby()

        role = r
        service?.role = r

        val accent  = getColor(R.color.accent)
        val surface = getColor(R.color.surface)
        val bg      = getColor(R.color.bg)

        binding.btnRoleSensor1.setBackgroundColor(if (r == "sensor1") accent else surface)
        binding.btnRoleSensor1.setTextColor(if (r == "sensor1") bg else accent)
        binding.btnRoleHub.setBackgroundColor(if (r == "hub") accent else surface)
        binding.btnRoleHub.setTextColor(if (r == "hub") bg else accent)
        binding.btnRoleCam.setBackgroundColor(if (r == "cam") accent else surface)
        binding.btnRoleCam.setTextColor(if (r == "cam") bg else accent)

        // Show/hide sections
        val isSensor = r == "sensor1" || r == "hub"
        binding.sectionSensors.visibility = if (isSensor) android.view.View.VISIBLE else android.view.View.GONE
        binding.sectionMode.visibility    = if (isSensor) android.view.View.VISIBLE else android.view.View.GONE
        binding.sectionSide.visibility    = if (isSensor) android.view.View.VISIBLE else android.view.View.GONE

        binding.tvNearbyStatus.text = "Nearby: idle"
        binding.tvFirebaseStatus.text = if (r == "hub") "Firebase: idle" else ""

        when (r) {
            "sensor1" -> {
                binding.tvRoleHint.text = "Phone 1 — IMU sensor, streams to HUB via Bluetooth"
                requestNearbyPermissions { service?.startNearbyAdvertising() }
            }
            "hub" -> {
                binding.tvRoleHint.text = "Phone 2 — own IMU + receives Sensor 1 + writes to Firebase"
                requestNearbyPermissions { service?.startNearbyDiscovery() }
            }
            "cam" -> {
                binding.tvRoleHint.text = "Phone 3 — video recording, uploads to Firebase Storage"
                binding.tvNearbyStatus.text = ""
            }
        }
    }

    private fun requestNearbyPermissions(onGranted: () -> Unit) {
        val needed = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!has(Manifest.permission.BLUETOOTH_SCAN))      needed += Manifest.permission.BLUETOOTH_SCAN
            if (!has(Manifest.permission.BLUETOOTH_ADVERTISE)) needed += Manifest.permission.BLUETOOTH_ADVERTISE
            if (!has(Manifest.permission.BLUETOOTH_CONNECT))   needed += Manifest.permission.BLUETOOTH_CONNECT
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (!has(Manifest.permission.NEARBY_WIFI_DEVICES)) needed += Manifest.permission.NEARBY_WIFI_DEVICES
        }
        if (!has(Manifest.permission.ACCESS_FINE_LOCATION)) needed += Manifest.permission.ACCESS_FINE_LOCATION

        if (needed.isEmpty()) {
            onGranted()
        } else {
            permLauncher.launch(needed.toTypedArray())
        }
    }

    // ── Sport mode ────────────────────────────────────────────────────────────

    private fun setAppMode(mode: String) {
        appMode = mode
        val accent  = getColor(R.color.accent)
        val surface = getColor(R.color.surface)
        val bg      = getColor(R.color.bg)
        if (mode == "boxing") {
            binding.btnModeBoxing.setBackgroundColor(accent);       binding.btnModeBoxing.setTextColor(bg)
            binding.btnModeRollerblade.setBackgroundColor(surface); binding.btnModeRollerblade.setTextColor(accent)
            binding.tvGpsStatus.visibility  = android.view.View.GONE
            binding.tvRoundInfo.visibility  = android.view.View.VISIBLE
        } else {
            binding.btnModeRollerblade.setBackgroundColor(accent);  binding.btnModeRollerblade.setTextColor(bg)
            binding.btnModeBoxing.setBackgroundColor(surface);      binding.btnModeBoxing.setTextColor(accent)
            binding.tvGpsStatus.visibility  = android.view.View.VISIBLE
            binding.tvRoundInfo.visibility  = android.view.View.GONE
        }
        service?.appMode = mode
        updateLiveUrl()
    }

    // ── Device side ───────────────────────────────────────────────────────────

    private fun setDeviceSide(side: String) {
        service?.deviceSide = side
        val accent  = getColor(R.color.accent)
        val surface = getColor(R.color.surface)
        val bg      = getColor(R.color.bg)
        if (side == "left") {
            binding.btnLeft.setBackgroundColor(accent);   binding.btnLeft.setTextColor(bg)
            binding.btnRight.setBackgroundColor(surface); binding.btnRight.setTextColor(accent)
            binding.tvModeHint.text = if (appMode == "boxing") "Left wrist" else "Left pocket"
        } else {
            binding.btnLeft.setBackgroundColor(surface);  binding.btnLeft.setTextColor(accent)
            binding.btnRight.setBackgroundColor(accent);  binding.btnRight.setTextColor(bg)
            binding.tvModeHint.text = if (appMode == "boxing") "Right wrist" else "Right pocket"
        }
    }

    // ── Live URL / QR ─────────────────────────────────────────────────────────

    private fun updateLiveUrl() {
        val recording = service?.recState == RecordingService.RecState.RECORDING
        binding.tvLiveUrl.text = if (recording && activeSessionId > 0L)
            "● Live — tap to show QR again" else "Tap START RECORDING to get a session link"
    }

    private fun showSessionQr(sessionId: Long, name: String) {
        val page = if (appMode == "boxing") "boxing-realtime-viewer.html" else "tracer-real.html"
        val encodedName = java.net.URLEncoder.encode(name.ifEmpty { "Session" }, "UTF-8")
        val url = "https://vectorstarprobabilitydynamics.com/$page?sid=$sessionId&name=$encodedName"

        val qrView = ImageView(this)
        qrView.setImageBitmap(generateQr(url, 480))
        qrView.setPadding(48, 24, 48, 0)

        val shareBtn = android.widget.Button(this)
        shareBtn.text = "SHARE LINK"
        shareBtn.setPadding(48, 24, 48, 24)
        shareBtn.setOnClickListener {
            val shareIntent = Intent(Intent.ACTION_SEND)
            shareIntent.type = "text/plain"
            shareIntent.putExtra(Intent.EXTRA_TEXT, url)
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Join my APEX session: ${name.ifEmpty { "Session" }}")
            startActivity(Intent.createChooser(shareIntent, "Share session link"))
        }

        val container = android.widget.LinearLayout(this)
        container.orientation = android.widget.LinearLayout.VERTICAL
        container.addView(qrView)
        container.addView(shareBtn)

        AlertDialog.Builder(this)
            .setTitle(if (name.isEmpty()) "Session QR" else name)
            .setMessage("Up to 10 viewers — scan or share the link\n\n$url")
            .setView(container)
            .setPositiveButton("OK", null)
            .show()
    }

    // ── UI refresh ────────────────────────────────────────────────────────────

    private fun refreshUi() {
        val recording = service?.recState == RecordingService.RecState.RECORDING
        binding.btnRecord.text = if (recording) "■  STOP" else "●  START RECORDING"
        binding.btnRecord.setBackgroundColor(getColor(if (recording) R.color.stop_red else R.color.accent))
        if (!recording) {
            activeSessionId   = 0L
            activeSessionName = ""
            binding.tvTimer.text       = if (appMode == "boxing") "3:00" else "00:00"
            binding.tvRoundInfo.text   = if (appMode == "boxing") "ROUND 1" else ""
            binding.tvSampleCount.text = "Samples: 0"
            binding.tvPeakAccel.text   = "Peak: 0.0g"
        }
        updateLiveUrl()
    }

    private fun has(p: String) =
        ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    companion object {
        fun generateQr(text: String, size: Int): Bitmap {
            val bits = QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, size, size,
                mapOf(EncodeHintType.MARGIN to 1))
            val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
            for (x in 0 until size) for (y in 0 until size)
                bmp.setPixel(x, y, if (bits[x, y]) Color.BLACK else Color.WHITE)
            return bmp
        }
    }
}
