package com.nathangamalnasser.natapps.recorder

import android.content.Context
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

/** Phone 1 (SENSOR role) — advertises and streams IMU bytes to the HUB. */
class NearbyTransport(private val context: Context) {

    companion object {
        private const val TAG = "NearbyTransport"
        const val SERVICE_ID = "com.nathangamalnasser.natapps.recorder"
    }

    var onConnected:        (() -> Unit)?       = null
    var onDisconnected:     (() -> Unit)?       = null
    var onStatusChange:     ((String) -> Unit)? = null
    var onCommandReceived:  ((String) -> Unit)? = null

    private var connectedId: String? = null
    private val client by lazy { Nearby.getConnectionsClient(context) }

    private val lifeCycle = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(id: String, info: ConnectionInfo) {
            client.acceptConnection(id, payloadCb)
        }
        override fun onConnectionResult(id: String, res: ConnectionResolution) {
            if (res.status.isSuccess) {
                connectedId = id
                onConnected?.invoke()
                onStatusChange?.invoke("HUB connected ●")
                Log.d(TAG, "Connected to hub $id")
            } else {
                onStatusChange?.invoke("Connection failed: ${res.status.statusCode}")
            }
        }
        override fun onDisconnected(id: String) {
            if (connectedId == id) {
                connectedId = null
                onDisconnected?.invoke()
                onStatusChange?.invoke("HUB disconnected")
            }
        }
    }

    private val payloadCb = object : PayloadCallback() {
        override fun onPayloadReceived(id: String, payload: Payload) {
            payload.asBytes()?.let { onCommandReceived?.invoke(String(it)) }
        }
        override fun onPayloadTransferUpdate(id: String, update: PayloadTransferUpdate) {}
    }

    fun startAdvertising(deviceName: String) {
        val opts = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        client.startAdvertising(deviceName, SERVICE_ID, lifeCycle, opts)
            .addOnSuccessListener { onStatusChange?.invoke("Advertising — waiting for HUB…") }
            .addOnFailureListener { e -> onStatusChange?.invoke("Advertise failed: ${e.message}") }
    }

    fun send(bytes: ByteArray) {
        val id = connectedId ?: return
        client.sendPayload(id, Payload.fromBytes(bytes))
    }

    fun isConnected() = connectedId != null

    fun stop() {
        client.stopAdvertising()
        client.stopAllEndpoints()
        connectedId = null
    }
}
