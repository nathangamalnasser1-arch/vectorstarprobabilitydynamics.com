package com.nathangamalnasser.natapps.recorder

import android.content.Context
import android.util.Log
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

/** Phone 2 (HUB role) — discovers SENSOR 1 and receives its IMU stream. */
class NearbyReceiver(private val context: Context) {

    companion object {
        private const val TAG = "NearbyReceiver"
    }

    var onConnected:    (() -> Unit)?       = null
    var onDisconnected: (() -> Unit)?       = null
    var onDataReceived: ((ByteArray) -> Unit)? = null
    var onStatusChange: ((String) -> Unit)? = null

    private var connectedId: String? = null
    private val client by lazy { Nearby.getConnectionsClient(context) }

    private val discoveryCb = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(id: String, info: DiscoveredEndpointInfo) {
            onStatusChange?.invoke("SENSOR 1 found — connecting…")
            client.requestConnection("hub", id, lifeCycle)
                .addOnFailureListener { e -> onStatusChange?.invoke("Connect failed: ${e.message}") }
        }
        override fun onEndpointLost(id: String) {
            onStatusChange?.invoke("SENSOR 1 lost — scanning…")
        }
    }

    private val lifeCycle = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(id: String, info: ConnectionInfo) {
            client.acceptConnection(id, payloadCb)
        }
        override fun onConnectionResult(id: String, res: ConnectionResolution) {
            if (res.status.isSuccess) {
                connectedId = id
                client.stopDiscovery()
                onConnected?.invoke()
                onStatusChange?.invoke("SENSOR 1 connected ●")
                Log.d(TAG, "Connected to sensor $id")
            } else {
                onStatusChange?.invoke("Rejected: ${res.status.statusCode}")
            }
        }
        override fun onDisconnected(id: String) {
            if (connectedId == id) {
                connectedId = null
                onDisconnected?.invoke()
                onStatusChange?.invoke("SENSOR 1 disconnected")
            }
        }
    }

    private val payloadCb = object : PayloadCallback() {
        override fun onPayloadReceived(id: String, payload: Payload) {
            payload.asBytes()?.let { onDataReceived?.invoke(it) }
        }
        override fun onPayloadTransferUpdate(id: String, update: PayloadTransferUpdate) {}
    }

    fun startDiscovering() {
        val opts = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        client.startDiscovery(NearbyTransport.SERVICE_ID, discoveryCb, opts)
            .addOnSuccessListener { onStatusChange?.invoke("Scanning for SENSOR 1…") }
            .addOnFailureListener { e -> onStatusChange?.invoke("Discovery failed: ${e.message}") }
    }

    /** Send a command (JSON string) back to SENSOR 1, e.g. a start trigger. */
    fun sendToSensor(json: String) {
        val id = connectedId ?: return
        client.sendPayload(id, Payload.fromBytes(json.toByteArray()))
    }

    fun isConnected() = connectedId != null

    fun stop() {
        client.stopDiscovery()
        client.stopAllEndpoints()
        connectedId = null
    }
}
