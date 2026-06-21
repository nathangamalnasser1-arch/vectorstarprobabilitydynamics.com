package com.nathangamalnasser.natapps.recorder

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.os.IBinder
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.nathangamalnasser.natapps.recorder.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var service: RecordingService? = null
    private var bound = false
    private var appMode = "rollerblade"

    private val svcConn = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, b: IBinder) {
            service = (b as RecordingService.LocalBinder).get()
            bound = true
            wireCallbacks()
            refreshUi()
        }
        override fun onServiceDisconnected(name: ComponentName) { bound = false; service = null }
    }

    private val permLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { /* permissions handled */ }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        requestNeededPermissions()
        val intent = Intent(this, RecordingService::class.java)
        startService(intent)
        bindService(intent, svcConn, Context.BIND_AUTO_CREATE)

        setupClicks()
        setMode("left")
        updateLiveUrl()
    }

    override fun onDestroy() {
        super.onDestroy()
        if (bound) unbindService(svcConn)
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private fun requestNeededPermissions() {
        val needed = mutableListOf<String>()
        if (!has(Manifest.permission.ACCESS_FINE_LOCATION)) needed += Manifest.permission.ACCESS_FINE_LOCATION
        if (needed.isNotEmpty()) permLauncher.launch(needed.toTypedArray())
    }

    private fun updateLiveUrl() {
        val ip = service?.getLocalIp() ?: runCatching {
            java.net.NetworkInterface.getNetworkInterfaces()?.toList()
                ?.flatMap { it.inetAddresses.toList() }
                ?.firstOrNull { !it.isLoopbackAddress && it is java.net.Inet4Address }
                ?.hostAddress
        }.getOrNull() ?: "?"
        binding.tvLiveUrl.text = "http://$ip:8080"
    }

    private fun has(p: String) =
        ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    // ── Service wiring ────────────────────────────────────────────────────────

    private fun wireCallbacks() {
        val svc = service ?: return
        svc.onStateChanged = { runOnUiThread { refreshUi() } }
        svc.onTimerTick    = { elapsed, count, peak ->
            runOnUiThread {
                val min = elapsed / 60000; val sec = (elapsed / 1000) % 60
                binding.tvTimer.text      = "%02d:%02d".format(min, sec)
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
                    binding.tvGyroStatus.text = "GYRO: DEAD  ✕  (orientation unavailable)"
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
                binding.tvTimer.text = "%d:%02d".format(m, s)
            }
        }
        svc.onPeerState = { state, msg ->
            runOnUiThread {
                binding.tvRelayStatus.text = when (state) {
                    PeerJSClient.State.CONNECTED  -> "Relay: streaming ●"
                    PeerJSClient.State.CONNECTING -> "Relay: connecting…"
                    PeerJSClient.State.ERROR      -> "Relay: $msg"
                    else                          -> "Relay: idle"
                }
                binding.btnConnect.text = if (
                    state == PeerJSClient.State.CONNECTED ||
                    state == PeerJSClient.State.CONNECTING
                ) "DISCONNECT" else "CONNECT"
            }
        }
        updateLiveUrl()
    }

    // ── Clicks ────────────────────────────────────────────────────────────────

    private fun setupClicks() {
        binding.btnModeRollerblade.setOnClickListener { setAppMode("rollerblade") }
        binding.btnModeBoxing.setOnClickListener      { setAppMode("boxing") }
        binding.btnLeft.setOnClickListener  { setMode("left") }
        binding.btnRight.setOnClickListener { setMode("right") }

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

        binding.btnRecord.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.recState == RecordingService.RecState.RECORDING) {
                svc.stopRecording()
            } else {
                val input = EditText(this).apply {
                    hint = "Session name (optional)"
                    setSingleLine(true)
                    setPadding(48, 32, 48, 16)
                }
                AlertDialog.Builder(this)
                    .setTitle("New Session")
                    .setView(input)
                    .setPositiveButton("START") { _, _ ->
                        svc.appMode = appMode
                        svc.startRecording(input.text.toString().trim())
                        showLiveQr(appMode == "boxing")
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }

        binding.tvLiveUrl.setOnClickListener { showLiveQr(appMode == "boxing") }

        binding.btnSessions.setOnClickListener {
            startActivity(Intent(this, SessionsActivity::class.java))
        }
    }

    // ── QR code ───────────────────────────────────────────────────────────────

    private fun showLiveQr(boxing: Boolean = false) {
        val ip = service?.getLocalIp() ?: "?"
        if (ip == "?") { android.widget.Toast.makeText(this, "No WiFi IP yet", android.widget.Toast.LENGTH_SHORT).show(); return }
        val url = if (boxing) "http://$ip:8080/boxing?live=1" else "http://$ip:8080/?live=1"
        val label = if (boxing) "Scan to watch boxing live" else "Scan to watch live on any browser"
        showQrDialog(url, label)
    }

    fun showQrDialog(url: String, subtitle: String) {
        val qr = ImageView(this).apply {
            setImageBitmap(generateQr(url, 512))
            setPadding(48, 32, 48, 8)
        }
        AlertDialog.Builder(this)
            .setTitle(subtitle)
            .setMessage(url)
            .setView(qr)
            .setPositiveButton("OK", null)
            .show()
    }

    // ── App mode ──────────────────────────────────────────────────────────────

    private fun setAppMode(mode: String) {
        appMode = mode
        val accent  = getColor(R.color.accent)
        val surface = getColor(R.color.surface)
        val bg      = getColor(R.color.bg)
        if (mode == "boxing") {
            binding.btnModeBoxing.setBackgroundColor(accent);       binding.btnModeBoxing.setTextColor(bg)
            binding.btnModeRollerblade.setBackgroundColor(surface); binding.btnModeRollerblade.setTextColor(accent)
            binding.tvGpsStatus.visibility = android.view.View.GONE
            binding.tvRoundInfo.visibility = android.view.View.VISIBLE
        } else {
            binding.btnModeRollerblade.setBackgroundColor(accent);  binding.btnModeRollerblade.setTextColor(bg)
            binding.btnModeBoxing.setBackgroundColor(surface);      binding.btnModeBoxing.setTextColor(accent)
            binding.tvGpsStatus.visibility = android.view.View.VISIBLE
            binding.tvRoundInfo.visibility = android.view.View.GONE
        }
        setMode(if (service?.deviceSide != null) service!!.deviceSide else "left")
        updateLiveUrl()
    }

    // ── Device side ───────────────────────────────────────────────────────────

    private fun setMode(side: String) {
        service?.deviceSide = side
        val accent   = getColor(R.color.accent)
        val surface  = getColor(R.color.surface)
        val bg       = getColor(R.color.bg)

        if (side == "left") {
            binding.btnLeft.setBackgroundColor(accent);   binding.btnLeft.setTextColor(bg)
            binding.btnRight.setBackgroundColor(surface); binding.btnRight.setTextColor(accent)
            binding.tvModeHint.text = if (appMode == "boxing") "Left wrist" else "Left pocket"
        } else {
            binding.btnLeft.setBackgroundColor(surface); binding.btnLeft.setTextColor(accent)
            binding.btnRight.setBackgroundColor(accent); binding.btnRight.setTextColor(bg)
            binding.tvModeHint.text = if (appMode == "boxing") "Right wrist" else "Right pocket"
        }
    }

    // ── UI refresh ────────────────────────────────────────────────────────────

    private fun refreshUi() {
        val recording = service?.recState == RecordingService.RecState.RECORDING
        binding.btnRecord.text = if (recording) "■  STOP" else "●  START RECORDING"
        binding.btnRecord.setBackgroundColor(
            getColor(if (recording) R.color.stop_red else R.color.accent)
        )
        if (!recording) {
            binding.tvTimer.text       = if (appMode == "boxing") "3:00" else "00:00"
            binding.tvRoundInfo.text   = if (appMode == "boxing") "ROUND 1" else ""
            binding.tvSampleCount.text = "Samples: 0"
            binding.tvPeakAccel.text   = "Peak: 0.0g"
        }
        updateLiveUrl()
    }

    companion object {
        fun generateQr(text: String, size: Int): Bitmap {
            val hints = mapOf(EncodeHintType.MARGIN to 1)
            val bits = QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, size, size, hints)
            val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
            for (x in 0 until size) for (y in 0 until size)
                bmp.setPixel(x, y, if (bits[x, y]) Color.BLACK else Color.WHITE)
            return bmp
        }
    }
}
