package com.nathangamalnasser.natapps.recorder

import com.google.firebase.Timestamp
import com.google.firebase.database.ktx.database
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import org.json.JSONObject

/**
 * HUB role: writes live sensor samples to RTDB for the web viewer, and writes
 * the completed session summary + UIS score to Firestore on session end.
 */
class FirebaseHubWriter(
    private val sessionId: Long,
    private val uid: String,
    private val sport: String
) {
    private val rtdb by lazy { Firebase.database.reference }
    private val db   by lazy { Firebase.firestore }

    private val sessionRef get() = rtdb.child("sessions").child(sessionId.toString())

    fun writeSessionStart() {
        sessionRef.child("meta").setValue(mapOf(
            "uid"       to uid,
            "sport"     to sport,
            "startTime" to sessionId,
            "status"    to "recording"
        ))
    }

    /** Overwrite `{side}/latest` — called at ~10 Hz for live web viewer. */
    fun writeSample(side: String, sample: JSONObject) {
        sessionRef.child(side).child("latest").setValue(mapOf(
            "t"         to sample.optLong("t"),
            "ax"        to sample.optDouble("ax"),
            "ay"        to sample.optDouble("ay"),
            "az"        to sample.optDouble("az"),
            "gx"        to sample.optDouble("gx"),
            "gy"        to sample.optDouble("gy"),
            "gz"        to sample.optDouble("gz"),
            "accel_mag" to sample.optDouble("accel_mag"),
            "gyro_mag"  to sample.optDouble("gyro_mag")
        ))
    }

    /** Called on session stop: writes summary to Firestore + marks RTDB ended. */
    fun writeSessionEnd(
        durationMs:  Long,
        uisRaw:      Double,
        uisScore:    Int,
        localCount:  Int,
        remoteCount: Int
    ) {
        db.collection("sessions").document(sessionId.toString()).set(hashMapOf(
            "uid"         to uid,
            "sport"       to sport,
            "startTime"   to sessionId,
            "durationMs"  to durationMs,
            "uisRaw"      to uisRaw,
            "uisScore"    to uisScore,
            "localCount"  to localCount,
            "remoteCount" to remoteCount,
            "createdAt"   to Timestamp.now()
        ))
        sessionRef.child("meta").child("status").setValue("ended")

        // Update user's all-time high score if this session is better
        val userRef = db.collection("users").document(uid)
        db.runTransaction { tx ->
            val snap = tx.get(userRef)
            val best = snap.getDouble("uisHighScore") ?: 0.0
            if (uisScore > best) tx.update(userRef, "uisHighScore", uisScore.toDouble())
            null
        }
    }
}
