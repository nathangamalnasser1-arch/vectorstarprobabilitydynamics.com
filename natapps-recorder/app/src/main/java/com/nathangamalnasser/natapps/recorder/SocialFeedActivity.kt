package com.nathangamalnasser.natapps.recorder

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

class SocialFeedActivity : AppCompatActivity() {

    private val db  by lazy { try { Firebase.firestore } catch (e: Exception) { null } }
    private val uid get() = try { FirebaseAuth.getInstance().currentUser?.uid ?: "" } catch (e: Exception) { "" }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_social)
        if (db == null) { toast("Firebase not configured yet"); finish(); return }
        loadFeed()

        val etFollow = findViewById<EditText>(R.id.etFollowUid)
        findViewById<Button>(R.id.btnFollow).setOnClickListener {
            val target = etFollow.text.toString().trim()
            if (target.isEmpty() || target == uid) return@setOnClickListener
            db!!.collection("follows").document("${uid}_$target")
                .set(mapOf("follower" to uid, "followee" to target, "at" to System.currentTimeMillis()))
                .addOnSuccessListener { toast("Now following!") }
                .addOnFailureListener { toast("Failed") }
        }

        val etMyUid = findViewById<TextView>(R.id.tvMyUid)
        etMyUid.text = "Your UID: $uid"
    }

    private fun loadFeed() {
        db!!.collection("sessions")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(50)
            .get()
            .addOnSuccessListener { snap ->
                val items = snap.documents.map { doc ->
                    val sport  = doc.getString("sport") ?: "?"
                    val score  = doc.getLong("uisScore") ?: 0L
                    val owner  = doc.getString("uid")?.take(8) ?: "?"
                    val durMs  = doc.getLong("durationMs") ?: 0L
                    val min    = durMs / 60000; val sec = (durMs / 1000) % 60
                    "[$sport]  UIS $score / 1000  •  ${min}m${sec}s  (${owner}…)"
                }
                val list = findViewById<ListView>(R.id.listFeed)
                list.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, items)
            }
            .addOnFailureListener { toast("Load failed — check Firestore rules") }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
