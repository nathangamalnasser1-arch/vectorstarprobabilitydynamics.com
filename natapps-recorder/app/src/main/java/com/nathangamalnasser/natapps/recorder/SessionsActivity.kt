package com.nathangamalnasser.natapps.recorder

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.IBinder
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.nathangamalnasser.natapps.recorder.databinding.ActivitySessionsBinding
import com.nathangamalnasser.natapps.recorder.databinding.ItemSessionBinding
import org.json.JSONArray
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class SessionsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySessionsBinding
    private var service: RecordingService? = null
    private var bound = false
    private var adapter: SessionAdapter? = null

    private val svcConn = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName, b: IBinder) {
            service = (b as RecordingService.LocalBinder).get()
            bound = true
            refreshList()
        }
        override fun onServiceDisconnected(name: ComponentName) { bound = false; service = null }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySessionsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }

        adapter = SessionAdapter(
            onExport = { file -> exportSession(file) },
            onDelete = { file -> confirmDelete(file) }
        )
        binding.rvSessions.layoutManager = LinearLayoutManager(this)
        binding.rvSessions.adapter = adapter

        val intent = Intent(this, RecordingService::class.java)
        startService(intent)
        bindService(intent, svcConn, Context.BIND_AUTO_CREATE)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (bound) unbindService(svcConn)
    }

    private fun refreshList() {
        val files = service?.getSessionFiles() ?: emptyList()
        adapter?.setFiles(files)
        binding.tvEmpty.visibility = if (files.isEmpty()) android.view.View.VISIBLE else android.view.View.GONE
    }

    private fun exportSession(file: File) {
        try {
            val json = JSONArray(file.readText())
            val ts = json.getJSONObject(0).optLong("id", System.currentTimeMillis())
            val date = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date(ts))
            val outName = "natapps_session_$date.json"

            val outFile = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                File(getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), outName)
            } else {
                @Suppress("DEPRECATION")
                File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), outName)
            }
            outFile.writeText(file.readText())
            Toast.makeText(this, "Exported to ${outFile.absolutePath}", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Export failed: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun confirmDelete(file: File) {
        AlertDialog.Builder(this)
            .setTitle("Delete session?")
            .setMessage("This cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                service?.deleteSession(file)
                refreshList()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // ── Adapter ───────────────────────────────────────────────────────────────

    class SessionAdapter(
        private val onExport: (File) -> Unit,
        private val onDelete: (File) -> Unit
    ) : RecyclerView.Adapter<SessionAdapter.VH>() {

        private val files = mutableListOf<File>()

        fun setFiles(list: List<File>) {
            files.clear(); files.addAll(list); notifyDataSetChanged()
        }

        inner class VH(val b: ItemSessionBinding) : RecyclerView.ViewHolder(b.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            VH(ItemSessionBinding.inflate(LayoutInflater.from(parent.context), parent, false))

        override fun getItemCount() = files.size

        override fun onBindViewHolder(holder: VH, position: Int) {
            val file = files[position]
            try {
                val arr = JSONArray(file.readText())
                val obj = arr.getJSONObject(0)
                val ts  = obj.optLong("id", 0L)
                val date = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date(ts))
                val dur  = obj.optLong("duration_ms", 0L)
                val min  = dur / 60000; val sec = (dur / 1000) % 60
                val channels = if (arr.length() > 1) "Left + Right" else obj.optString("device", "?").replaceFirstChar { it.uppercase() }
                val count = obj.optInt("sample_count", 0)
                holder.b.tvTitle.text = "$date  ·  $channels"
                holder.b.tvMeta.text  = "Duration %02d:%02d  ·  %,d samples".format(min, sec, count)
            } catch (e: Exception) {
                holder.b.tvTitle.text = file.name
                holder.b.tvMeta.text  = "Error reading file"
            }
            holder.b.btnExport.setOnClickListener { onExport(file) }
            holder.b.btnDelete.setOnClickListener { onDelete(file) }
        }
    }
}
