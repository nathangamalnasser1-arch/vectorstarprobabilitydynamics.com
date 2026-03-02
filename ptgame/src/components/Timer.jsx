import { useState, useEffect } from 'react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatTime(ms) {
  if (ms == null) return '00:00.000';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const frac = ms % 1000;
  return `${pad2(min)}:${pad2(sec)}.${String(frac).padStart(3, '0')}`;
}

export function Timer({ running, startTime, stoppedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [running]);

  const displayMs = stoppedAt != null
    ? stoppedAt - startTime
    : running
      ? now - startTime
      : null;

  return (
    <div className="font-mono text-2xl text-slate-300 tabular-nums">
      {formatTime(displayMs)}
    </div>
  );
}
