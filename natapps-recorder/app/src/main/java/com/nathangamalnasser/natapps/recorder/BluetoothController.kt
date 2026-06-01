package com.nathangamalnasser.natapps.recorder

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothServerSocket
import android.bluetooth.BluetoothSocket
import android.util.Log
import kotlinx.coroutines.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.util.UUID

class BluetoothController {

    companion object {
        private const val TAG = "BTController"
        // Custom UUID for this app — both phones must use the same
        private val APP_UUID: UUID = UUID.fromString("b8f4a7c3-1e2d-4f5a-8b6c-0d3e7f2a9c1b")
        private const val SERVICE_NAME = "NatappsRecorder"

        const val CMD_START = "START"
        const val CMD_STOP  = "STOP"
        const val CMD_PING  = "PING"
        const val CMD_PONG  = "PONG"
    }

    enum class State { IDLE, WAITING, CONNECTING, CONNECTED, ERROR }

    var state = State.IDLE
        private set

    /** Called on main thread */
    var onStateChange: ((State, String) -> Unit)? = null
    /** Called on main thread when a START/STOP command arrives from the peer */
    var onCommand: ((String) -> Unit)? = null
    /** Called on main thread when a JSON sensor sample arrives from the peer */
    var onRemoteSample: ((String) -> Unit)? = null

    private var serverSocket: BluetoothServerSocket? = null
    private var socket: BluetoothSocket? = null
    private var writer: PrintWriter? = null

    private val mainScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val ioScope   = CoroutineScope(Dispatchers.IO   + SupervisorJob())

    fun startServer(adapter: BluetoothAdapter) {
        setState(State.WAITING, "Waiting for RIGHT phone to connect…")
        ioScope.launch {
            try {
                serverSocket = adapter.listenUsingRfcommWithServiceRecord(SERVICE_NAME, APP_UUID)
                val s = serverSocket!!.accept()   // blocks until peer connects
                serverSocket?.close()
                serverSocket = null
                attachSocket(s)
            } catch (e: Exception) {
                Log.e(TAG, "Server error", e)
                if (state == State.WAITING) setState(State.ERROR, "BT error: ${e.message}")
            }
        }
    }

    fun connectToDevice(adapter: BluetoothAdapter, device: BluetoothDevice) {
        setState(State.CONNECTING, "Connecting to ${device.name}…")
        ioScope.launch {
            try {
                adapter.cancelDiscovery()
                val s = device.createRfcommSocketToServiceRecord(APP_UUID)
                s.connect()
                attachSocket(s)
            } catch (e: Exception) {
                Log.e(TAG, "Connect error", e)
                setState(State.ERROR, "Connection failed — is LEFT phone waiting?")
            }
        }
    }

    private fun attachSocket(s: BluetoothSocket) {
        socket = s
        writer = PrintWriter(s.outputStream, true)
        setState(State.CONNECTED, "Connected ↔ ${s.remoteDevice.name}")
        startReading(s)
    }

    private fun startReading(s: BluetoothSocket) {
        ioScope.launch {
            try {
                BufferedReader(InputStreamReader(s.inputStream)).forEachLine { line ->
                    when {
                        line == CMD_PING -> sendRaw(CMD_PONG)
                        line == CMD_PONG -> { /* keepalive reply */ }
                        line == CMD_START || line == CMD_STOP ->
                            mainScope.launch { onCommand?.invoke(line) }
                        line.startsWith("{") ->
                            mainScope.launch { onRemoteSample?.invoke(line) }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Read error", e)
            }
            mainScope.launch { setState(State.ERROR, "Peer disconnected") }
        }
    }

    fun sendCommand(cmd: String) = sendRaw(cmd)

    /** Send a JSON sensor sample line — fire-and-forget, non-blocking */
    fun sendSample(json: String) {
        ioScope.launch { writer?.println(json) }
    }

    private fun sendRaw(msg: String) {
        ioScope.launch { writer?.println(msg) }
    }

    fun cancelServer() {
        serverSocket?.close()
        serverSocket = null
        if (state == State.WAITING) setState(State.IDLE, "Ready")
    }

    fun disconnect() {
        serverSocket?.close()
        socket?.close()
        serverSocket = null
        socket = null
        writer = null
        setState(State.IDLE, "Disconnected")
    }

    private fun setState(s: State, msg: String) {
        state = s
        mainScope.launch { onStateChange?.invoke(s, msg) }
    }

    fun isConnected() = state == State.CONNECTED
}
