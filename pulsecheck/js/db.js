// ====== PulseCheck Data Layer ======
// All data stored locally. No server. No accounts. No tracking.

const DB = {

  // ---- Tasks ----
  getTasks() {
    return JSON.parse(localStorage.getItem('pc_tasks') || '[]')
  },
  saveTasks(tasks) {
    localStorage.setItem('pc_tasks', JSON.stringify(tasks))
  },

  // ---- Session ----
  getSession() {
    return JSON.parse(localStorage.getItem('pc_session') || 'null')
  },
  saveSession(s) {
    localStorage.setItem('pc_session', JSON.stringify(s))
  },

  // ---- Checkpoints ----
  getCheckpoints() {
    return JSON.parse(localStorage.getItem('pc_checkpoints') || '[]')
  },
  addCheckpoint(cp) {
    const list = this.getCheckpoints()
    list.push(cp)
    localStorage.setItem('pc_checkpoints', JSON.stringify(list))
  },

  // ---- History (past days) ----
  getHistory() {
    return JSON.parse(localStorage.getItem('pc_history') || '[]')
  },
  archiveDay() {
    const session = this.getSession()
    if (!session) return
    const record = {
      session,
      tasks: this.getTasks(),
      checkpoints: this.getCheckpoints(),
      archivedAt: Date.now()
    }
    const h = this.getHistory()
    // Deduplicate by session id
    const filtered = h.filter(r => r.session.id !== session.id)
    filtered.push(record)
    localStorage.setItem('pc_history', JSON.stringify(filtered))
  },

  // ---- Timer state ----
  getNextCheckpoint() {
    const v = localStorage.getItem('pc_next_cp')
    return v ? parseInt(v) : null
  },
  setNextCheckpoint(ts) {
    localStorage.setItem('pc_next_cp', ts)
  },
  clearNextCheckpoint() {
    localStorage.removeItem('pc_next_cp')
  },

  // ---- Reset today ----
  clearToday() {
    localStorage.removeItem('pc_tasks')
    localStorage.removeItem('pc_session')
    localStorage.removeItem('pc_checkpoints')
    localStorage.removeItem('pc_next_cp')
  }
}
