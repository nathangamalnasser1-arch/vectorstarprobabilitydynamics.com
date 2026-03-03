import { useState, useCallback } from 'react';
import { getElements, shuffleArray, getFact, getNumberAtSlot } from './data/elements';
import { PeriodicGrid } from './components/PeriodicGrid';
import { CurrentCard } from './components/CurrentCard';
import { FactPopup } from './components/FactPopup';

const TOTAL = 118;

function App() {
  const [deck] = useState(() => shuffleArray(getElements()));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState(new Set());
  const [factPopup, setFactPopup] = useState(null); // { name, fact }
  const [wrongSlot, setWrongSlot] = useState(null);

  const currentCard = currentIndex < deck.length ? deck[currentIndex] : null;
  const currentNumber = currentCard?.number ?? null;

  const handleCellClick = useCallback(
    (row, col) => {
      const expectedNumber = getNumberAtSlot(row, col);
      if (expectedNumber === null) return;

      if (expectedNumber !== currentNumber) {
        setWrongSlot({ row, col });
        const t = setTimeout(() => setWrongSlot(null), 400);
        return () => clearTimeout(t);
      }

      const nextPlaced = new Set([...placed, expectedNumber]);
      setPlaced(nextPlaced);
      setWrongSlot(null);

      const name = deck.find((e) => e.number === expectedNumber)?.name ?? `Element ${expectedNumber}`;
      const fact = getFact(expectedNumber) ?? `${name} is element number ${expectedNumber} on the periodic table.`;
      setFactPopup({ name, fact, number: expectedNumber });
    },
    [currentNumber, deck, placed]
  );

  function advanceCard() {
    setFactPopup(null);
    setCurrentIndex((prev) => prev + 1);
  }

  const cardsRemaining = deck.length - currentIndex;
  const gameComplete = placed.size === TOTAL;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Periodic Placement
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Place each element on the table in order. How fast can you complete it?
        </p>
      </header>

      <div className="flex flex-wrap items-start justify-center gap-8 max-w-6xl">
        <aside className="flex flex-col items-center gap-4 w-64">
          <CurrentCard element={currentCard} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-sm">Cards left: <strong className="text-slate-200">{cardsRemaining}</strong></span>
          </div>
          {gameComplete && (
            <p className="text-emerald-400 font-medium">Complete!</p>
          )}
        </aside>

        <main className="overflow-x-auto">
          <PeriodicGrid
            placed={placed}
            currentNumber={currentNumber}
            onCellClick={handleCellClick}
            wrongSlot={wrongSlot}
          />
        </main>
      </div>

      {factPopup && (
        <FactPopup
          elementName={factPopup.name}
          elementNumber={factPopup.number}
          fact={factPopup.fact}
          onClose={advanceCard}
        />
      )}
    </div>
  );
}

export default App;
