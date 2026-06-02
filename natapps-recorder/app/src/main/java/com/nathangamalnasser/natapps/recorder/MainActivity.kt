package com.nathangamalnasser.natapps.recorder

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.IBinder
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.nathangamalnasser.natapps.recorder.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var service: RecordingService? = null
    private var bound = false

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
    }

    override fun onDestroy() {
        super.onDestroy()
        if (bound) unbindService(svcConn)
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private fun requestNeededPermissions() {
        val needed = mutableListOf<String>()
        if (!has(Manifest.permission.INTERNET)) needed += Manifest.permission.INTERNET
        if (needed.isNotEmpty()) permLauncher.launch(needed.toTypedArray())
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
        svc.onPeerState = { state, msg ->
            runOnUiThread {
                binding.tvPeerStatus.text = msg
                val connected = state == PeerJSClient.State.CONNECTED
                binding.btnConnect.text = if (
                    state == PeerJSClient.State.CONNECTED ||
                    state == PeerJSClient.State.CONNECTING
                ) "DISCONNECT" else "CONNECT"
                binding.btnRecord.isEnabled = connected ||
                        service?.recState == RecordingService.RecState.RECORDING
            }
        }
        if (svc.isPeerConnected()) {
            binding.tvPeerStatus.text = "Live — streaming to viewer"
            binding.btnConnect.text   = "DISCONNECT"
            binding.btnRecord.isEnabled = true
        }
    }

    // ── Clicks ────────────────────────────────────────────────────────────────

    private fun setupClicks() {
        binding.btnLeft.setOnClickListener  { setMode("left") }
        binding.btnRight.setOnClickListener { setMode("right") }

        binding.btnConnect.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.isPeerConnected() ||
                binding.tvPeerStatus.text.contains("Connecting")) {
                svc.disconnectFromViewer()
            } else {
                val code = binding.etSessionCode.text.toString().trim().uppercase()
                if (code.length != 6) {
                    Toast.makeText(this, "Enter the 6-character code shown on the viewer", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                svc.connectToViewer(code)
            }
        }

        binding.etSessionCode.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO) {
                binding.btnConnect.performClick(); true
            } else false
        }

        binding.btnRecord.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.recState == RecordingService.RecState.RECORDING) {
                svc.stopRecording()
            } else {
                svc.startRecording()
            }
        }

        binding.btnSessions.setOnClickListener {
            startActivity(Intent(this, SessionsActivity::class.java))
        }
    }

    // ── Mode ──────────────────────────────────────────────────────────────────

    private fun setMode(side: String) {
        service?.deviceSide = side
        val accent   = getColor(R.color.accent)
        val surface  = getColor(R.color.surface)
        val bg       = getColor(R.color.bg)

        if (side == "left") {
            binding.btnLeft.setBackgroundColor(accent);   binding.btnLeft.setTextColor(bg)
            binding.btnRight.setBackgroundColor(surface); binding.btnRight.setTextColor(accent)
            binding.tvModeHint.text = "Left pocket"
        } else {
            binding.btnLeft.setBackgroundColor(surface); binding.btnLeft.setTextColor(accent)
            binding.btnRight.setBackgroundColor(accent); binding.btnRight.setTextColor(bg)
            binding.tvModeHint.text = "Right pocket"
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
            binding.tvTimer.text       = "00:00"
            binding.tvSampleCount.text = "Samples: 0"
            binding.tvPeakAccel.text   = "Peak: 0.0g"
        }
    }
}
