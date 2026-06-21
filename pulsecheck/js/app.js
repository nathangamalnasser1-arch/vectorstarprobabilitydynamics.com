// ====== PulseCheck App ======

let setupTasks = []         // tasks being built in setup
let checkpointQueue = []    // active tasks for current checkpoint round
let cpIndex = 0             // which task in the checkpoint queue
let countdownTimer = null   // setInterval reference
let pendingRemoveId = null  // task id awaiting remove confirmation

// ====== Bootstrap ======
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'checkpoint') triggerCheckpoint()
    })
  }

  // Setup input: Enter key adds task
  q('#new-task-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask()
  })

  // Interval slider
  q('#interval-slider').addEventListener('input', updateIntervalDisplay)

  // Checkpoint slider + comment
  q('#cp-slider').addEventListener('input', updateCpPct)
  q('#cp-comment').addEventListener('input', updateCharCount)

  // Checkpoint buttons
  q('#cp-next-btn').addEventListener('click', submitCheckpointTask)
  q('#cp-remove-btn').addEventListener('click', showRemoveConfirm)
  q('#remove-cancel').addEventListener('click', hideRemoveConfirm)
  q('#remove-confirm-btn').addEventListener('click', confirmRemove)

  // Intercept back button while checkpoint is open
  window.addEventListener('popstate', () => {
    if (!q('#checkpoint-overlay').classList.contains('hidden')) {
      history.pushState({ cp: true }, '')
    }
  })

  // If user comes back to tab while overdue — trigger checkpoint
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const next = DB.getNextCheckpoint()
      const session = DB.getSession()
      if (session && !session.endedAt && next && Date.now() >= next) {
        triggerCheckpoint()
      }
    }
  })

  // Init
  const session = DB.getSession()
  if (session && !session.endedAt && isToday(session.startedAt)) {
    restoreActiveDay()
  } else {
    showView('setup')
    initSetup()
  }
})

// ====== Utility ======
function q(sel) { return document.querySelector(sel) }
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36) }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function isToday(ts) {
  const d = new Date(ts), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

// ====== View routing ======
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.hidden = true)
  const el = q(`#view-${name}`)
  if (el) el.hidden = false
  const nav = q('#app-nav')
  nav.hidden = (name === 'setup' || name === 'summary')
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name)
  })
}

function navTo(name) {
  if (name === 'active') { renderActiveTasks(); showView('active') }
  else if (name === 'progress') { renderProgress(); showView('progress') }
  else if (name === 'history') { renderHistory(); showView('history') }
}

// ====== Setup ======
function initSetup() {
  setupTasks = []
  renderSetupTasks()
  updateIntervalDisplay()
  updateStartBtn()
  refreshNotifNote()
}

function refreshNotifNote() {
  const el = q('#permission-note')
  if (!('Notification' in window)) { el.textContent = 'Notifications not supported in this browser — keep the tab open for reminders.'; el.className = 'permission-note warn'; return }
  if (Notification.permission === 'denied') { el.textContent = 'Notifications blocked. Enable them in browser settings for reminders when the tab is in the background.'; el.className = 'permission-note danger'; return }
  if (Notification.permission === 'default') { el.textContent = 'Allow notifications so reminders fire even when the tab is in the background.'; el.className = 'permission-note info'; return }
  el.textContent = 'Notifications enabled. Reminders will fire even in the background.'
  el.className = 'permission-note ok'
}

function addTask() {
  const input = q('#new-task-input')
  const name = input.value.trim()
  if (!name) return
  if (setupTasks.length >= 7) {
    q('#task-limit-msg').hidden = false
    input.focus()
    return
  }
  setupTasks.push({ id: uuid(), name, createdAt: Date.now(), removedAt: null })
  input.value = ''
  q('#task-limit-msg').hidden = true
  renderSetupTasks()
  updateStartBtn()
  input.focus()
}

function removeSetupTask(id) {
  setupTasks = setupTasks.filter(t => t.id !== id)
  if (setupTasks.length < 7) q('#task-limit-msg').hidden = true
  renderSetupTasks()
  updateStartBtn()
}

function renderSetupTasks() {
  const list = q('#task-list')
  if (setupTasks.length === 0) { list.innerHTML = ''; return }
  list.innerHTML = setupTasks.map((t, i) => `
    <div class="setup-task" id="st-${t.id}">
      <span class="setup-num">${i + 1}</span>
      <span class="setup-name">${esc(t.name)}</span>
      <button class="setup-remove" onclick="removeSetupTask('${t.id}')" aria-label="Remove">×</button>
    </div>
  `).join('')
}

function updateIntervalDisplay() {
  const val = q('#interval-slider').value
  q('#interval-val').textContent = val
  const hints = { 5:'Very frequent — great for sprint sessions', 10:'Quick pulses — good for scattered days', 15:'Frequent — recommended for most people', 20:'Balanced rhythm', 25:'Moderate pace', 30:'Relaxed check-ins — good for creative work', 40:'Long sessions', 50:'Extended focus blocks', 60:'One check per hour' }
  q('#interval-hint').textContent = hints[val] || 'Balanced rhythm'
}

function updateStartBtn() {
  q('#start-btn').disabled = setupTasks.length === 0
}

async function startDay() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
    refreshNotifNote()
  }

  const intervalMin = parseInt(q('#interval-slider').value)
  const session = { id: uuid(), startedAt: Date.now(), endedAt: null, intervalMinutes: intervalMin }

  DB.saveTasks([...setupTasks])
  DB.saveSession(session)

  const nextCp = Date.now() + intervalMin * 60 * 1000
  DB.setNextCheckpoint(nextCp)

  showView('active')
  renderActiveTasks()
  startCountdown(nextCp)
}

// ====== Active Day ======
function restoreActiveDay() {
  showView('active')
  renderActiveTasks()

  const next = DB.getNextCheckpoint()
  if (!next || Date.now() >= next) {
    // Overdue or no timer saved — trigger now
    setTimeout(triggerCheckpoint, 400)
  } else {
    startCountdown(next)
  }
}

function renderActiveTasks() {
  const tasks = DB.getTasks()
  const checkpoints = DB.getCheckpoints()
  const session = DB.getSession()

  q('#active-date').textContent = fmtDate(Date.now())

  const active = tasks.filter(t => !t.removedAt)
  const list = q('#active-task-list')

  if (active.length === 0) {
    list.innerHTML = '<div class="empty-state">All tasks removed. Tap "I\'m done" to wrap up.</div>'
    return
  }

  list.innerHTML = active.map(t => {
    const cps = checkpoints.filter(c => c.taskId === t.id && c.action === 'answered')
    const last = cps[cps.length - 1]
    const pct = last ? last.pct : 0
    const label = last ? `${pct}%` : 'Not checked yet'
    const checkins = cps.length
    return `
      <div class="active-card">
        <div class="active-card-top">
          <span class="active-task-name">${esc(t.name)}</span>
          <span class="active-task-pct ${pct >= 100 ? 'done' : ''}">${label}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="active-card-meta">${checkins} check-in${checkins !== 1 ? 's' : ''}</div>
      </div>
    `
  }).join('')
}

function startCountdown(nextCpTime) {
  if (countdownTimer) clearInterval(countdownTimer)
  const el = q('#countdown-time')

  function tick() {
    const remaining = nextCpTime - Date.now()
    if (remaining <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      el.textContent = 'Now!'
      triggerCheckpoint()
    } else {
      el.textContent = fmtCountdown(remaining)
    }
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}

function triggerCheckpoint() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }

  const tasks = DB.getTasks().filter(t => !t.removedAt)
  if (tasks.length === 0) { finishDay(); return }

  if (document.hidden || !document.hasFocus()) {
    fireNotification('PulseCheck — Check-in time', `${tasks.length} task${tasks.length > 1 ? 's' : ''} waiting for your update.`)
  }

  checkpointQueue = [...tasks]
  cpIndex = 0
  openCheckpointModal()
}

// ====== Checkpoint Modal (the lock) ======
function openCheckpointModal() {
  q('#checkpoint-overlay').hidden = false
  document.body.style.overflow = 'hidden'
  history.pushState({ cp: true }, '')

  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
  if (navigator.vibrate) navigator.vibrate([100, 50, 100])

  renderCpTask()
}

function renderCpTask() {
  const task = checkpointQueue[cpIndex]
  if (!task) { closeCheckpointModal(); return }

  q('#cp-progress').textContent = `Task ${cpIndex + 1} of ${checkpointQueue.length}`
  q('#cp-task-name').textContent = task.name
  q('#cp-slider').value = 0
  q('#cp-pct').textContent = '0%'
  q('#cp-comment').value = ''
  q('#cp-char-count').textContent = '0 / 500'
  q('#cp-next-btn').textContent = cpIndex === checkpointQueue.length - 1 ? 'Done ✓' : 'Next →'
}

function updateCpPct() {
  q('#cp-pct').textContent = `${q('#cp-slider').value}%`
}

function updateCharCount() {
  q('#cp-char-count').textContent = `${q('#cp-comment').value.length} / 500`
}

function submitCheckpointTask() {
  const task = checkpointQueue[cpIndex]
  DB.addCheckpoint({
    id: uuid(),
    taskId: task.id,
    timestamp: Date.now(),
    pct: parseInt(q('#cp-slider').value),
    comment: q('#cp-comment').value.trim() || null,
    action: 'answered'
  })
  cpIndex++
  if (cpIndex >= checkpointQueue.length) closeCheckpointModal()
  else renderCpTask()
}

function showRemoveConfirm() {
  pendingRemoveId = checkpointQueue[cpIndex]?.id
  q('#remove-comment').value = ''
  q('#remove-confirm').hidden = false
}

function hideRemoveConfirm() {
  q('#remove-confirm').hidden = true
  pendingRemoveId = null
}

function confirmRemove() {
  if (!pendingRemoveId) return
  const comment = q('#remove-comment').value.trim()

  const tasks = DB.getTasks()
  const task = tasks.find(t => t.id === pendingRemoveId)
  if (task) { task.removedAt = Date.now(); DB.saveTasks(tasks) }

  DB.addCheckpoint({
    id: uuid(),
    taskId: pendingRemoveId,
    timestamp: Date.now(),
    pct: null,
    comment: comment || null,
    action: 'removed'
  })

  hideRemoveConfirm()
  cpIndex++
  if (cpIndex >= checkpointQueue.length) closeCheckpointModal()
  else renderCpTask()
}

function closeCheckpointModal() {
  q('#checkpoint-overlay').hidden = true
  document.body.style.overflow = ''

  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})

  const activeTasks = DB.getTasks().filter(t => !t.removedAt)
  if (activeTasks.length === 0) { finishDay(); return }

  const session = DB.getSession()
  if (!session) return

  const next = Date.now() + session.intervalMinutes * 60 * 1000
  DB.setNextCheckpoint(next)

  renderActiveTasks()
  startCountdown(next)
}

// ====== Progress / Journal ======
function renderProgress() {
  const tasks = DB.getTasks()
  const checkpoints = DB.getCheckpoints()
  const el = q('#progress-content')

  if (tasks.length === 0) {
    el.innerHTML = '<div class="empty-state">Start a day to see your journal here.</div>'
    return
  }

  el.innerHTML = tasks.map(task => {
    const cps = checkpoints.filter(c => c.taskId === task.id)
    const answered = cps.filter(c => c.action === 'answered')
    const isRemoved = !!task.removedAt
    const finalPct = answered.length ? answered[answered.length - 1].pct : null

    const entries = cps.map(cp => {
      if (cp.action === 'removed') {
        return `<div class="journal-entry removed">
          <div class="je-time">${fmtTime(cp.timestamp)}</div>
          <div class="je-body"><span class="je-badge removed">Removed</span>${cp.comment ? `<p class="je-comment">${esc(cp.comment)}</p>` : ''}</div>
        </div>`
      }
      const w = cp.pct
      return `<div class="journal-entry">
        <div class="je-time">${fmtTime(cp.timestamp)}</div>
        <div class="je-body">
          <div class="je-bar-wrap"><div class="je-bar" style="width:${w}%"></div><span class="je-pct">${w}%</span></div>
          ${cp.comment ? `<p class="je-comment">${esc(cp.comment)}</p>` : ''}
        </div>
      </div>`
    }).join('')

    return `<div class="journal-task ${isRemoved ? 'removed' : ''}">
      <div class="jt-header">
        <span class="jt-name">${esc(task.name)}</span>
        ${isRemoved ? '<span class="je-badge removed">removed</span>' : (finalPct != null ? `<span class="jt-final">${finalPct}%</span>` : '')}
      </div>
      <div class="journal-entries">${entries || '<div class="je-empty">No check-ins yet</div>'}</div>
    </div>`
  }).join('')
}

// ====== History ======
function renderHistory() {
  const history = DB.getHistory()
  const el = q('#history-content')

  if (history.length === 0) {
    el.innerHTML = '<div class="empty-state">Past days will appear here after you complete them.</div>'
    return
  }

  const sorted = [...history].reverse()
  el.innerHTML = sorted.map(record => {
    const { session, tasks, checkpoints } = record
    const active = tasks.filter(t => !t.removedAt)
    const answered = checkpoints.filter(c => c.action === 'answered')
    const avg = active.length ? Math.round(active.reduce((sum, t) => {
      const cps = answered.filter(c => c.taskId === t.id)
      return sum + (cps.length ? cps[cps.length-1].pct : 0)
    }, 0) / active.length) : 0
    const duration = session.endedAt ? Math.round((session.endedAt - session.startedAt) / 60000) : null

    return `<div class="history-card">
      <div class="hc-date">${fmtDate(session.startedAt)}</div>
      <div class="hc-stats">
        <span>${active.length} task${active.length !== 1 ? 's' : ''}</span>
        <span>${avg}% avg completion</span>
        <span>${answered.length} check-ins</span>
        ${duration != null ? `<span>${duration}m session</span>` : ''}
      </div>
    </div>`
  }).join('')
}

// ====== Summary ======
function finishDay() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }

  const session = DB.getSession()
  if (session && !session.endedAt) {
    session.endedAt = Date.now()
    DB.saveSession(session)
  }

  DB.archiveDay()
  renderSummary()
  showView('summary')
}

function renderSummary() {
  const tasks = DB.getTasks()
  const checkpoints = DB.getCheckpoints()
  const session = DB.getSession()

  q('#summary-date').textContent = fmtDate(Date.now())

  const answered = checkpoints.filter(c => c.action === 'answered')
  const active = tasks.filter(t => !t.removedAt)
  const removed = tasks.filter(t => t.removedAt)

  const taskRows = tasks.map(task => {
    const cps = answered.filter(c => c.taskId === task.id)
    const last = cps[cps.length - 1]
    const pct = last?.pct ?? 0
    const isRemoved = !!task.removedAt
    return `<div class="summary-task ${isRemoved ? 'removed' : ''}">
      <div class="st-name">${esc(task.name)}</div>
      ${isRemoved
        ? '<span class="je-badge removed">removed</span>'
        : `<div class="st-bar-wrap"><div class="st-bar" style="width:${pct}%"></div><span class="st-pct">${pct}%</span></div>`
      }
    </div>`
  }).join('')

  const avg = active.length ? Math.round(active.reduce((sum, t) => {
    const cps = answered.filter(c => c.taskId === t.id)
    return sum + (cps.length ? cps[cps.length-1].pct : 0)
  }, 0) / active.length) : 0

  const duration = session?.endedAt ? Math.round((session.endedAt - session.startedAt) / 60000) : 0

  q('#summary-content').innerHTML = `
    <div class="summary-stats">
      <div class="ss-card"><div class="ss-num">${avg}%</div><div class="ss-label">avg completion</div></div>
      <div class="ss-card"><div class="ss-num">${answered.length}</div><div class="ss-label">check-ins</div></div>
      <div class="ss-card"><div class="ss-num">${duration}m</div><div class="ss-label">session length</div></div>
    </div>
    <div class="section-label" style="margin-bottom:12px">Task breakdown</div>
    ${taskRows}
  `
}

function newDay() {
  DB.clearToday()
  showView('setup')
  initSetup()
}

// ====== Notifications ======
function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, requireInteraction: true })
    n.onclick = () => { window.focus(); n.close(); if (q('#checkpoint-overlay').hidden) triggerCheckpoint() }
  } catch (e) {}
}
