export function FactPopup({ elementName, fact, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="max-w-md w-full rounded-2xl border border-amber-500/50 bg-slate-900 shadow-2xl shadow-amber-500/10 p-6">
        <h3 className="text-lg font-semibold text-amber-400 mb-2">{elementName}</h3>
        <p className="text-slate-300 leading-relaxed">{fact}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-medium py-2.5 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
