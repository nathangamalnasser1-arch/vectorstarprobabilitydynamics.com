const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 9001 });
const viewers = new Set();
const sensors = {};

wss.on('connection', ws => {
    ws.on('message', raw => {
        try {
            const msg = JSON.parse(raw);
            if (msg.type === 'register') {
                ws.role   = msg.role;
                ws.device = msg.device;
                if (msg.role === 'viewer') {
                    viewers.add(ws);
                } else {
                    sensors[msg.device] = ws;
                    broadcast({ type: 'status', device: msg.device, connected: true });
                    console.log(`[+] ${msg.device} phone connected`);
                }
            } else if (msg.type === 'sensor') {
                broadcast(raw.toString(), true);
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        viewers.delete(ws);
        if (ws.device && sensors[ws.device] === ws) {
            delete sensors[ws.device];
            broadcast({ type: 'status', device: ws.device, connected: false });
            console.log(`[-] ${ws.device} phone disconnected`);
        }
    });
});

function broadcast(data, raw) {
    const msg = raw ? data : JSON.stringify(data);
    viewers.forEach(v => { if (v.readyState === WebSocket.OPEN) v.send(msg); });
}

const os = require('os');
const ips = Object.values(os.networkInterfaces()).flat()
    .filter(n => n.family === 'IPv4' && !n.internal)
    .map(n => n.address);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Natapps Relay  —  ws://[IP]:9001');
console.log('  Enter one of these IPs in the phone app:');
ips.forEach(ip => console.log(`  →  ${ip}`));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
