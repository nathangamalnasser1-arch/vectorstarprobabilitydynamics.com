import { getElectronShells } from '../data/elements';

const VIEW_SIZE = 160;
const CX = VIEW_SIZE / 2;
const CY = VIEW_SIZE / 2;
const MAX_RING_RADIUS = 56; // keep everything well inside the viewBox
const ELECTRON_R = 3.5;

export function AtomicStructure({ atomicNumber }) {
  const shells = getElectronShells(atomicNumber);
  const numRings = shells.length;
  const pitch = numRings > 0 ? MAX_RING_RADIUS / numRings : 0;

  return (
    <figure className="flex flex-col items-center gap-1 my-3">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-32 h-32"
        aria-label={`Electron shell diagram for element ${atomicNumber}`}
      >
        <defs>
          <radialGradient id="nucleus-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <radialGradient id="electron-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </radialGradient>
        </defs>
        {/* Electron rings and dots */}
        {shells.map((count, i) => {
          const r = (i + 1) * pitch;
          const dots = [];
          for (let j = 0; j < count; j++) {
            const angle = (j / count) * 2 * Math.PI - Math.PI / 2;
            const x = CX + r * Math.cos(angle);
            const y = CY + r * Math.sin(angle);
            dots.push(
              <circle
                key={`e-${i}-${j}`}
                cx={x}
                cy={y}
                r={ELECTRON_R}
                fill="url(#electron-grad)"
                stroke="#0e7490"
                strokeWidth="1"
              />
            );
          }
          return (
            <g key={`ring-${i}`}>
              <circle
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity={0.7}
              />
              {dots}
            </g>
          );
        })}
        {/* Nucleus */}
        <circle
          cx={CX}
          cy={CY}
          r={Math.min(10, MAX_RING_RADIUS / 4)}
          fill="url(#nucleus-grad)"
          stroke="#475569"
          strokeWidth="1"
        />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[8px] font-bold fill-slate-900"
          style={{ fontSize: '8px' }}
        >
          {atomicNumber}
        </text>
      </svg>
      <figcaption className="text-xs text-slate-500 font-mono">
        {getElectronShells(atomicNumber).join(', ')} electrons per shell
      </figcaption>
    </figure>
  );
}
