import { getGridMatrix, getNumberAtSlot } from '../data/elements';

const BLOCK_COLORS = {
  s: 'bg-red-600/90 border-red-400 text-white',
  p: 'bg-amber-400/90 border-amber-200 text-slate-900',
  d: 'bg-blue-600/90 border-blue-300 text-white',
  f: 'bg-emerald-600/90 border-emerald-300 text-white',
};

export function PeriodicGrid({ placed, currentNumber, onCellClick, wrongSlot }) {
  const matrix = getGridMatrix();

  return (
    <div
      className="inline-grid gap-0.5 p-1 rounded-lg bg-slate-800/50 border border-slate-600"
      style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
    >
      {matrix.map((row, r) =>
        row.map((slot, c) => {
          const row1 = r + 1;
          const col1 = c + 1;
          const expectedNumber = getNumberAtSlot(row1, col1);
          const isEmpty = expectedNumber === null;
          const isPlaced = expectedNumber !== null && placed.has(expectedNumber);
          const placedData = isPlaced && slot ? { ...slot } : null;
          const isWrong = wrongSlot && wrongSlot.row === row1 && wrongSlot.col === col1;

          if (isEmpty) {
            return <div key={`${r}-${c}`} className="min-w-[28px] min-h-[32px] w-7 h-8" />;
          }

          const blockClass = placedData ? BLOCK_COLORS[placedData.block] || 'bg-slate-500' : 'bg-slate-700/80 border-slate-500 hover:bg-slate-600';
          const clickable = !isPlaced && currentNumber !== null;

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onCellClick(row1, col1)}
              className={`
                min-w-[28px] min-h-[32px] w-7 h-8 flex flex-col items-center justify-center
                border rounded text-[10px] font-mono font-semibold
                transition-colors duration-150
                ${blockClass}
                ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400' : 'cursor-default'}
                ${isWrong ? 'animate-shake ring-2 ring-red-500' : ''}
              `}
            >
              {isPlaced && placedData ? (
                <>
                  <span className="leading-tight">{placedData.symbol}</span>
                  <span className="text-[8px] opacity-90">{placedData.number}</span>
                </>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 font-medium" title={`Place element ${expectedNumber} here`}>
                  {expectedNumber}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
