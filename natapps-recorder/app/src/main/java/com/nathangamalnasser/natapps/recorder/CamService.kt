package com.nathangamalnasser.natapps.recorder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentValues
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleService
import java.text.SimpleDateFormat
import java.util.*

class CamService : LifecycleService() {

    companion object {
        private const val TAG      = "CamService"
        private const val CHANNEL  = "cam_channel"
        private const val NOTIF_ID = 2
    }

    inner class LocalBinder : Binder() { fun get() = this@CamService }
    private val binder = LocalBinder()
    override fun onBind(intent: Intent): IBinder { super.onBind(intent); return binder }

    var isRecording = false; private set
    var onStatusChange: ((String) -> Unit)? = null

    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording:    Recording? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(NOTIF_ID, buildNotif("CAM ready"))
        setupCamera()
    }

    private fun setupCamera() {
        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            try {
                val provider = future.get()
                val recorder = Recorder.Builder()
                    .setQualitySelector(QualitySelector.from(Quality.HD))
                    .build()
                videoCapture = VideoCapture.withOutput(recorder)
                provider.unbindAll()
                provider.bindToLifecycle(this, CameraSelector.DEFAULT_BACK_CAMERA, videoCapture!!)
                onStatusChange?.invoke("CAM ready")
            } catch (e: Exception) {
                Log.e(TAG, "Camera setup failed", e)
                onStatusChange?.invoke("CAM error: ${e.message}")
            }
        }, ContextCompat.getMainExecutor(this))
    }

    fun startRecording(sessionId: Long) {
        val vc = videoCapture ?: run { onStatusChange?.invoke("CAM not ready"); return }

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date(sessionId))
        val fileName  = "Natapps_${timestamp}.mp4"

        val hasAudio = ContextCompat.checkSelfPermission(this,
            android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED

        // prepareRecording is called inside each branch so Kotlin sees the concrete output type
        val pending: PendingRecording = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val cv = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/NatappsRecorder")
            }
            val opts = MediaStoreOutputOptions
                .Builder(contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
                .setContentValues(cv).build()
            vc.output.prepareRecording(this, opts)
        } else {
            val dir  = android.os.Environment.getExternalStoragePublicDirectory(
                android.os.Environment.DIRECTORY_MOVIES)
            val opts = FileOutputOptions.Builder(java.io.File(dir, fileName)).build()
            vc.output.prepareRecording(this, opts)
        }

        recording = (if (hasAudio) pending.withAudioEnabled() else pending)
            .start(ContextCompat.getMainExecutor(this)) { event ->
                when (event) {
                    is VideoRecordEvent.Start -> {
                        isRecording = true
                        updateNotif("CAM recording ●")
                        onStatusChange?.invoke("CAM recording ●")
                    }
                    is VideoRecordEvent.Finalize -> {
                        isRecording = false
                        updateNotif("CAM ready")
                        if (event.hasError()) {
                            onStatusChange?.invoke("CAM error: ${event.error}")
                        } else {
                            onStatusChange?.invoke("CAM saved to gallery ✓")
                        }
                    }
                    else -> {}
                }
            }
    }

    fun stopRecording() { recording?.stop() }

    override fun onDestroy() { super.onDestroy(); recording?.stop() }

    private fun createChannel() {
        val ch = NotificationChannel(CHANNEL, "Camera", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }
    private fun buildNotif(text: String): Notification =
        NotificationCompat.Builder(this, CHANNEL)
            .setContentTitle("APEX CAM").setContentText(text)
            .setSmallIcon(R.drawable.ic_record).setOngoing(true).setSilent(true).build()
    private fun updateNotif(text: String) =
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotif(text))
}
