package com.nathangamalnasser.natapps.recorder

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

class ChallengeActivity : AppCompatActivity() {

    private val db  by lazy { Firebase.firestore }
    private val uid get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_challenge)

        val spinner = findViewById<Spinner>(R.id.spinnerSport)
        spinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item,
            listOf("boxing", "rollerblade"))
            .also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }

        val etTarget = findViewById<EditText>(R.id.etChallengeTarget)
        findViewById<Button>(R.id.btnChallenge).setOnClickListener {
            val target = etTarget.text.toString().trim()
            val sport  = spinner.selectedItem.toString()
            if (target.isEmpty()) { toast("Enter a target UID"); return@setOnClickListener }
            sendChallenge(target, sport)
        }

        loadIncoming()
    }

    private fun sendChallenge(target: String, sport: String) {
        db.collection("sessions")
            .whereEqualTo("uid", uid)
            .whereEqualTo("sport", sport)
            .orderBy("uisScore", Query.Direction.DESCENDING)
            .limit(1)
            .get()
            .addOnSuccessListener { snap ->
                val best = snap.documents.firstOrNull()?.getLong("uisScore") ?: 0L
                db.collection("challenges").add(mapOf(
                    "challenger_uid" to uid,
                    "challenged_uid" to target,
                    "sport"          to sport,
                    "challengerUis"  to best,
                    "challengedUis"  to null,
                    "status"         to "pending",
                    "createdAt"      to Timestamp.now()
                )).addOnSuccessListener { toast("Challenge sent! (your best: $best)") }
                  .addOnFailureListener { toast("Failed to send") }
            }
            .addOnFailureListener { toast("No sessions found for $sport") }
    }

    private fun loadIncoming() {
        db.collection("challenges")
            .whereEqualTo("challenged_uid", uid)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnSuccessListener { snap ->
                val items = snap.documents.map { doc ->
                    val sport   = doc.getString("sport") ?: "?"
                    val from    = doc.getString("challenger_uid")?.take(8) ?: "?"
                    val score   = doc.getLong("challengerUis") ?: 0L
                    val status  = doc.getString("status") ?: "pending"
                    "[$sport] Beat UIS $score — from ${from}…  [$status]"
                }
                val list = findViewById<ListView>(R.id.listChallenges)
                list.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, items)
            }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
