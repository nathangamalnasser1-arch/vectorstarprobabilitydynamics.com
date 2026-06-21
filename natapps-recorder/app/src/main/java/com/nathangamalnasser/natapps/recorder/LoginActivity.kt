package com.nathangamalnasser.natapps.recorder

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

class LoginActivity : AppCompatActivity() {

    private val auth by lazy { FirebaseAuth.getInstance() }

    private val googleClient by lazy {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        GoogleSignIn.getClient(this, gso)
    }

    private val googleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            firebaseAuth(GoogleAuthProvider.getCredential(account.idToken, null))
        } catch (e: ApiException) {
            toast("Google sign-in failed")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (auth.currentUser != null) { goMain(); return }
        setContentView(R.layout.activity_login)

        findViewById<Button>(R.id.btnGoogleSignIn).setOnClickListener {
            googleLauncher.launch(googleClient.signInIntent)
        }

        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPass  = findViewById<EditText>(R.id.etPassword)
        findViewById<Button>(R.id.btnEmailSignIn).setOnClickListener {
            val email = etEmail.text.toString().trim()
            val pass  = etPass.text.toString()
            if (email.isEmpty() || pass.isEmpty()) return@setOnClickListener
            auth.signInWithEmailAndPassword(email, pass)
                .addOnSuccessListener { ensureProfile(); goMain() }
                .addOnFailureListener {
                    auth.createUserWithEmailAndPassword(email, pass)
                        .addOnSuccessListener { ensureProfile(); goMain() }
                        .addOnFailureListener { e -> toast(e.message ?: "Auth failed") }
                }
        }
    }

    private fun firebaseAuth(credential: com.google.firebase.auth.AuthCredential) {
        auth.signInWithCredential(credential)
            .addOnSuccessListener { ensureProfile(); goMain() }
            .addOnFailureListener { e -> toast("Auth failed: ${e.message}") }
    }

    private fun ensureProfile() {
        val user = auth.currentUser ?: return
        val ref  = Firebase.firestore.collection("users").document(user.uid)
        ref.get().addOnSuccessListener { snap ->
            if (!snap.exists()) {
                ref.set(mapOf(
                    "displayName"  to (user.displayName ?: user.email?.substringBefore('@') ?: ""),
                    "email"        to (user.email ?: ""),
                    "createdAt"    to System.currentTimeMillis(),
                    "uisHighScore" to 0.0
                ))
            }
        }
    }

    private fun goMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
}
