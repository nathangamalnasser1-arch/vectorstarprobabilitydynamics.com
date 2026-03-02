export function CurrentCard({ element }) {
  if (!element) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800/80 px-8 py-6 text-center">
        <p className="text-slate-500 font-medium">All elements placed!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-cyan-500/80 bg-slate-800/90 px-8 py-6 text-center shadow-lg shadow-cyan-500/20">
      <p className="text-3xl font-bold font-mono text-cyan-300 tracking-wide">
        {element.symbol}
      </p>
      <p className="text-slate-400 mt-1 text-lg font-mono">{element.number}</p>
      <p className="text-slate-500 text-sm mt-2">Click the correct cell on the table</p>
    </div>
  );
}
