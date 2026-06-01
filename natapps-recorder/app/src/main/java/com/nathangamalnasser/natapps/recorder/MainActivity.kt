package com.nathangamalnasser.natapps.recorder

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.nathangamalnasser.natapps.recorder.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var service: RecordingService? = null
    private var bound = false

    private val bt = BluetoothController()
    private var btAdapter: BluetoothAdapter? = null

    // Current mode: "left" = LEFT phone (server), "right" = RIGHT phone (client)
    private var deviceSide = "left"

    // ── Service connection ────────────────────────────────────────────────────

    private val svcConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, binder: IBinder) {
            service = (binder as RecordingService.LocalBinder).get()
            bound = true
            wireServiceCallbacks()
            refreshRecordingUi()
        }
        override fun onServiceDisconnected(name: ComponentName) {
            bound = false; service = null
        }
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private val permLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { granted ->
        val allGranted = granted.values.all { it }
        if (!allGranted) {
            Toast.makeText(this, "Bluetooth permissions required", Toast.LENGTH_LONG).show()
        }
    }

    private val btEnableLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { /* user has enabled or declined BT */ }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        btAdapter = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter

        requestPermissions()
        startAndBindService()
        setupBtController()
        setupClickListeners()
        setMode("left")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (bound) unbindService(svcConnection)
        bt.disconnect()
    }

    // ── Setup ─────────────────────────────────────────────────────────────────

    private fun requestPermissions() {
        val needed = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!has(Manifest.permission.BLUETOOTH_CONNECT)) needed += Manifest.permission.BLUETOOTH_CONNECT
            if (!has(Manifest.permission.BLUETOOTH_SCAN))    needed += Manifest.permission.BLUETOOTH_SCAN
        } else {
            if (!has(Manifest.permission.ACCESS_FINE_LOCATION)) needed += Manifest.permission.ACCESS_FINE_LOCATION
        }
        if (needed.isNotEmpty()) permLauncher.launch(needed.toTypedArray())
    }

    private fun has(p: String) = ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

    private fun startAndBindService() {
        val intent = Intent(this, RecordingService::class.java)
        startService(intent)
        bindService(intent, svcConnection, Context.BIND_AUTO_CREATE)
    }

    private fun wireServiceCallbacks() {
        val svc = service ?: return
        svc.onStateChanged = { state -> runOnUiThread { refreshRecordingUi() } }
        svc.onTimerTick    = { elapsed, count, peak ->
            runOnUiThread {
                val min = elapsed / 60000; val sec = (elapsed / 1000) % 60
                binding.tvTimer.text = "%02d:%02d".format(min, sec)
                binding.tvSampleCount.text = "Samples: $count"
                binding.tvPeakAccel.text   = "Peak: ${"%.2f".format(peak / 9.81)}g"
            }
        }
        svc.onSensorUpdate = { ax, ay, az, gx, gy, gz ->
            runOnUiThread {
                binding.tvAx.text = "%.2f".format(ax)
                binding.tvAy.text = "%.2f".format(ay)
                binding.tvAz.text = "%.2f".format(az)
                binding.tvGx.text = "%.3f".format(gx)
                binding.tvGy.text = "%.3f".format(gy)
                binding.tvGz.text = "%.3f".format(gz)
            }
        }
        // Forward each sample to BT peer if connected
        svc.sampleReadyCallback = { json ->
            if (bt.isConnected()) bt.sendSample(json)
        }
        svc.deviceSide = deviceSide
    }

    private fun setupBtController() {
        bt.onStateChange = { state, msg ->
            binding.tvBtStatus.text = msg
            when (state) {
                BluetoothController.State.CONNECTED -> {
                    binding.btnBtAction.text = "DISCONNECT"
                    binding.btnBtAction.isEnabled = true
                }
                BluetoothController.State.WAITING, BluetoothController.State.CONNECTING -> {
                    binding.btnBtAction.text = "CANCEL"
                    binding.btnBtAction.isEnabled = true
                }
                else -> {
                    val isLeft = deviceSide == "left"
                    binding.btnBtAction.text = if (isLeft) "WAIT FOR RIGHT PHONE" else "CONNECT TO LEFT PHONE"
                    binding.btnBtAction.isEnabled = true
                }
            }
        }
        bt.onCommand = { cmd ->
            when (cmd) {
                BluetoothController.CMD_START -> service?.startRecording()
                BluetoothController.CMD_STOP  -> service?.stopRecording()
            }
        }
        bt.onRemoteSample = { json -> service?.addRemoteSample(json) }
    }

    private fun setupClickListeners() {
        binding.btnLeft.setOnClickListener  { setMode("left") }
        binding.btnRight.setOnClickListener { setMode("right") }

        binding.btnBtAction.setOnClickListener {
            when (bt.state) {
                BluetoothController.State.CONNECTED -> bt.disconnect()
                BluetoothController.State.WAITING   -> bt.cancelServer()
                BluetoothController.State.CONNECTING -> bt.disconnect()
                else -> initiateBtAction()
            }
        }

        binding.btnRecord.setOnClickListener {
            val svc = service ?: return@setOnClickListener
            if (svc.recState == RecordingService.RecState.RECORDING) {
                svc.stopRecording()
                bt.sendCommand(BluetoothController.CMD_STOP)
            } else {
                svc.startRecording()
                bt.sendCommand(BluetoothController.CMD_START)
            }
        }

        binding.btnSessions.setOnClickListener {
            startActivity(Intent(this, SessionsActivity::class.java))
        }
    }

    private fun setMode(side: String) {
        deviceSide = side
        service?.deviceSide = side
        val activeColor   = getColor(R.color.accent)
        val inactiveColor = getColor(R.color.surface)
        val activeText    = getColor(R.color.bg)
        val inactiveText  = getColor(R.color.accent)

        if (side == "left") {
            binding.btnLeft.setBackgroundColor(activeColor);   binding.btnLeft.setTextColor(activeText)
            binding.btnRight.setBackgroundColor(inactiveColor); binding.btnRight.setTextColor(inactiveText)
            binding.tvModeHint.text = "LEFT phone — waits for RIGHT to connect"
        } else {
            binding.btnLeft.setBackgroundColor(inactiveColor); binding.btnLeft.setTextColor(inactiveText)
            binding.btnRight.setBackgroundColor(activeColor);  binding.btnRight.setTextColor(activeText)
            binding.tvModeHint.text = "RIGHT phone — connects to LEFT phone"
        }
        binding.btnBtAction.text = if (side == "left") "WAIT FOR RIGHT PHONE" else "CONNECT TO LEFT PHONE"

        // Drop existing BT connection when mode changes
        if (bt.isConnected() || bt.state == BluetoothController.State.WAITING) bt.disconnect()
    }

    private fun initiateBtAction() {
        val adapter = btAdapter ?: run {
            Toast.makeText(this, "Bluetooth not available", Toast.LENGTH_SHORT).show(); return
        }
        if (!adapter.isEnabled) {
            btEnableLauncher.launch(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)); return
        }

        if (deviceSide == "left") {
            bt.startServer(adapter)
        } else {
            // Show paired device picker
            val paired = adapter.bondedDevices.toList()
            if (paired.isEmpty()) {
                Toast.makeText(this, "No paired devices — pair in Android Settings first", Toast.LENGTH_LONG).show()
                return
            }
            val names = paired.map { it.name ?: it.address }.toTypedArray()
            AlertDialog.Builder(this)
                .setTitle("Select LEFT phone")
                .setAdapter(ArrayAdapter(this, android.R.layout.simple_list_item_1, names)) { _, i ->
                    bt.connectToDevice(adapter, paired[i])
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun refreshRecordingUi() {
        val recording = service?.recState == RecordingService.RecState.RECORDING
        binding.btnRecord.text = if (recording) "■  STOP" else "●  START RECORDING"
        binding.btnRecord.setBackgroundColor(
            getColor(if (recording) R.color.stop_red else R.color.accent)
        )
        if (!recording) {
            binding.tvTimer.text = "00:00"
            binding.tvSampleCount.text = "Samples: 0"
            binding.tvPeakAccel.text   = "Peak: 0.0g"
        }
    }
}
