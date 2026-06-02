package com.nathangamalnasser.natapps.recorder

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import org.webrtc.*
import java.nio.ByteBuffer
import java.util.UUID
import java.util.concurrent.TimeUnit

class PeerJSClient(private val context: Context) {

    companion object {
        private const val TAG = "PeerJS"
        private const val WS_URL = "wss://0.peerjs.com/peerjs"

        @Volatile private var factoryInitialized = false

        private fun ensureInit(ctx: Context) {
            if (factoryInitialized) return
            PeerConnectionFactory.initialize(
                PeerConnectionFactory.InitializationOptions
                    .builder(ctx.applicationContext)
                    .setEnableInternalTracer(false)
                    .createInitializationOptions()
            )
            factoryInitialized = true
        }
    }

    enum class State { IDLE, CONNECTING, CONNECTED, ERROR }

    var onStateChange: ((State, String) -> Unit)? = null
    var onOpen: (() -> Unit)? = null
    var onClose: (() -> Unit)? = null

    private var deviceSide       = "left"
    private var myPeerId         = ""
    private var targetPeerId     = ""
    private var connId           = ""
    private var signalingDone    = false

    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(0,  TimeUnit.SECONDS)
        .pingInterval(10, TimeUnit.SECONDS)
        .build()

    private var ws:      WebSocket?           = null
    private var pc:      PeerConnection?      = null
    private var dc:      DataChannel?         = null
    private var factory: PeerConnectionFactory? = null

    private val main = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val io   = CoroutineScope(Dispatchers.IO   + SupervisorJob())

    // ── Public API ────────────────────────────────────────────────────────────

    fun connect(sessionCode: String, side: String) {
        deviceSide   = side
        myPeerId     = "natapps-$side-${UUID.randomUUID().toString().take(8)}"
        targetPeerId = "sklab-${sessionCode.uppercase()}"
        connId       = "dc_${UUID.randomUUID().toString().replace("-", "")}"

        ensureInit(context)
        if (factory == null) {
            factory = PeerConnectionFactory.builder()
                .setVideoEncoderFactory(null)
                .setVideoDecoderFactory(null)
                .createPeerConnectionFactory()
        }

        signalingDone = false
        setState(State.CONNECTING, "Connecting to session ${sessionCode.uppercase()}…")

        val token = UUID.randomUUID().toString().take(8)
        val url = "$WS_URL?key=peerjs&id=$myPeerId&token=$token"
        ws = http.newWebSocket(Request.Builder().url(url).build(), wsListener)
    }

    fun send(json: String) {
        try {
            dc?.send(DataChannel.Buffer(ByteBuffer.wrap(json.toByteArray()), false))
        } catch (_: Exception) {}
    }

    fun isConnected() = dc?.state() == DataChannel.State.OPEN

    fun disconnect() {
        dc?.close(); pc?.close(); ws?.close(1000, null)
        dc = null; pc = null; ws = null
        setState(State.IDLE, "Disconnected")
    }

    // ── WebSocket signaling ───────────────────────────────────────────────────

    private val wsListener = object : WebSocketListener() {
        override fun onMessage(ws: WebSocket, text: String) = handleMsg(text)
        override fun onFailure(ws: WebSocket, t: Throwable, r: Response?) =
            setState(State.ERROR, "Server error: ${t.message}")
        override fun onClosed(ws: WebSocket, code: Int, reason: String) {
            if (!signalingDone) setState(State.ERROR, "Signaling closed")
        }
    }

    private fun handleMsg(text: String) {
        try {
            val msg = JSONObject(text)
            when (msg.getString("type")) {
                "OPEN"      -> io.launch { createOffer() }
                "ANSWER"    -> {
                    signalingDone = true
                    val sdp = msg.getJSONObject("payload").getJSONObject("sdp")
                    pc?.setRemoteDescription(SimpleSdp(),
                        SessionDescription(SessionDescription.Type.ANSWER, sdp.getString("sdp")))
                }
                "CANDIDATE" -> {
                    val c = msg.getJSONObject("payload").getJSONObject("candidate")
                    pc?.addIceCandidate(IceCandidate(
                        c.getString("sdpMid"),
                        c.getInt("sdpMLineIndex"),
                        c.getString("candidate")
                    ))
                }
                "EXPIRE"    -> setState(State.ERROR, "Viewer not found — open the viewer first")
                "LEAVE"     -> setState(State.ERROR, "Viewer disconnected")
                "ERROR"     -> setState(State.ERROR, "Peer: ${msg.optString("payload")}")
            }
        } catch (e: Exception) { Log.e(TAG, "parse", e) }
    }

    // ── WebRTC ────────────────────────────────────────────────────────────────

    private fun createOffer() {
        val ice = listOf(PeerConnection.IceServer
            .builder("stun:stun.l.google.com:19302").createIceServer())

        pc = factory!!.createPeerConnection(PeerConnection.RTCConfiguration(ice), pcObs)
            ?: run { setState(State.ERROR, "PeerConnection failed"); return }

        dc = pc!!.createDataChannel(connId, DataChannel.Init().apply {
            ordered = false; maxRetransmits = 0
        })
        dc!!.registerObserver(dcObs)

        pc!!.createOffer(object : SimpleSdp() {
            override fun onCreateSuccess(sdp: SessionDescription) {
                pc!!.setLocalDescription(SimpleSdp(), sdp)
                val payload = JSONObject().apply {
                    put("sdp", JSONObject().apply {
                        put("sdp", sdp.description); put("type", "offer")
                    })
                    put("type", "data")
                    put("connectionId", connId)
                    put("metadata", JSONObject().put("device", deviceSide))
                    put("label", connId)
                    put("reliable", false)
                    put("serialization", "json")
                }
                ws?.send(JSONObject().apply {
                    put("type", "OFFER"); put("dst", targetPeerId); put("payload", payload)
                }.toString())
            }
        }, MediaConstraints())
    }

    private val pcObs = object : PeerConnection.Observer {
        override fun onIceCandidate(c: IceCandidate) {
            val payload = JSONObject().apply {
                put("candidate", JSONObject().apply {
                    put("candidate", c.sdp)
                    put("sdpMid", c.sdpMid)
                    put("sdpMLineIndex", c.sdpMLineIndex)
                })
                put("type", "candidate")
                put("connectionId", connId)
            }
            ws?.send(JSONObject().apply {
                put("type", "CANDIDATE"); put("dst", targetPeerId); put("payload", payload)
            }.toString())
        }
        override fun onConnectionChange(s: PeerConnection.PeerConnectionState) {
            if (s == PeerConnection.PeerConnectionState.FAILED ||
                s == PeerConnection.PeerConnectionState.DISCONNECTED)
                setState(State.ERROR, "WebRTC disconnected")
        }
        override fun onSignalingChange(s: PeerConnection.SignalingState)           {}
        override fun onIceConnectionChange(s: PeerConnection.IceConnectionState)   {}
        override fun onIceConnectionReceivingChange(r: Boolean)                    {}
        override fun onIceGatheringChange(s: PeerConnection.IceGatheringState)     {}
        override fun onIceCandidatesRemoved(c: Array<IceCandidate>)               {}
        override fun onAddStream(s: MediaStream)                                   {}
        override fun onRemoveStream(s: MediaStream)                                {}
        override fun onDataChannel(d: DataChannel)                                 {}
        override fun onRenegotiationNeeded()                                       {}
        override fun onAddTrack(r: RtpReceiver, s: Array<MediaStream>)            {}
    }

    private val dcObs = object : DataChannel.Observer {
        override fun onStateChange() {
            when (dc?.state()) {
                DataChannel.State.OPEN -> {
                    setState(State.CONNECTED, "Live — streaming to viewer")
                    main.launch { onOpen?.invoke() }
                }
                DataChannel.State.CLOSED, DataChannel.State.CLOSING -> {
                    setState(State.ERROR, "Channel closed")
                    main.launch { onClose?.invoke() }
                }
                else -> {}
            }
        }
        override fun onMessage(b: DataChannel.Buffer) {}
        override fun onBufferedAmountChange(a: Long)  {}
    }

    private fun setState(s: State, msg: String) {
        main.launch { onStateChange?.invoke(s, msg) }
    }
}

private open class SimpleSdp : SdpObserver {
    override fun onCreateSuccess(sdp: SessionDescription) {}
    override fun onSetSuccess()                           {}
    override fun onCreateFailure(e: String) { Log.e("SDP", "create: $e") }
    override fun onSetFailure(e: String)    { Log.e("SDP", "set: $e")    }
}
