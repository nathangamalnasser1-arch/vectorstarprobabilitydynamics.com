const WebSocket = require('ws')

const PORT = process.env.PORT || 9001
const wss = new WebSocket.Server({ port: PORT })

const viewers = new Set()
const sensors = new Map()
let cachedOrigin = null
let cachedRound  = null

wss.on('connection', ws => {
  ws._device = null
  ws._role   = null

  ws.on('message', data => {
    let msg
    try { msg = JSON.parse(data) } catch { return }
    const raw = data.toString()

    switch (msg.type) {
      case 'register':
        if (msg.role === 'viewer') {
          ws._role = 'viewer'
          viewers.add(ws)
          if (cachedOrigin) trySend(ws, cachedOrigin)
          if (cachedRound)  trySend(ws, cachedRound)
        } else {
          ws._role   = 'sensor'
          ws._device = msg.device
          sensors.set(msg.device, ws)
          broadcast(`{"type":"status","device":"${msg.device}","connected":true}`)
          console.log(`[+] ${msg.device} connected`)
        }
        break
      case 'start_recording':
        sensors.forEach((sWs) => { if (sWs !== ws) trySend(sWs, raw) })
        broadcast(raw)
        break
      case 'gps_origin':
        cachedOrigin = raw; broadcast(raw); break
      case 'round_start':
      case 'round_end':
        cachedRound = raw; broadcast(raw); break
      case 'sensor':
      case 'gps':
        broadcast(raw); break
    }
  })

  ws.on('close', () => {
    viewers.delete(ws)
    if (ws._device && sensors.get(ws._device) === ws) {
      sensors.delete(ws._device)
      broadcast(`{"type":"status","device":"${ws._device}","connected":false}`)
      console.log(`[-] ${ws._device} disconnected`)
    }
  })

  ws.on('error', () => {})
})

function broadcast(msg) { viewers.forEach(v => trySend(v, msg)) }
function trySend(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) try { ws.send(msg) } catch {}
}

console.log(`Relay listening on port ${PORT}`)
