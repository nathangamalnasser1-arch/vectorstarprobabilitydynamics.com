/**
 * Periodic table data for the game.
 * Grid: 9 rows × 18 columns. Rows 1–7 = main body, row 8 = lanthanides, row 9 = actinides.
 * (row, col) are 1-based.
 */
const ELEMENT_FACTS = {
  1: "It matches properties of both alkali metals and halogens, making it difficult to place by chemistry alone.",
  2: "The only element whose table position (Group 18) is routinely inconsistent with its electronic structure (s-block).",
  43: "The first element ever to be discovered by synthesis (1937) rather than in nature.",
  80: "Relativistic effects explain why this metal is a liquid at room temperature.",
  83: "It has an \"almost-stable\" isotope with a half-life over a billion times the age of the universe.",
  87: "The last element discovered in nature (1939); it has only been photographed as light emitted from microscopic quantities.",
  103: "Though traditionally placed at the end of the actinides, some scientists argue it belongs in the main body between elements 88 and 104.",
  106: "Named in honor of Glenn T. Seaborg, who discovered the actinide concept.",
  114: "Named after physicist Georgy Flyorov.",
  117: "One of the last elements to be named (in 2016), completing the 7th row of the table.",
  118: "Currently the heaviest known element, named after Yuri Oganessian.",
};

/** Get grid position for our 9×18 layout: (row 1-9, col 1-18) */
function getGridPosition(number) {
  if (number >= 58 && number <= 71) {
    return { row: 8, col: 4 + (number - 58) };
  }
  if (number >= 90 && number <= 103) {
    return { row: 9, col: 4 + (number - 90) };
  }
  // Main table: use standard period/group
  const main = MAIN_TABLE_POSITIONS[number];
  return main ? { row: main.period, col: main.group } : null;
}

const MAIN_TABLE_POSITIONS = {
  1: { period: 1, group: 1 },
  2: { period: 1, group: 18 },
  3: { period: 2, group: 1 },
  4: { period: 2, group: 2 },
  5: { period: 2, group: 13 },
  6: { period: 2, group: 14 },
  7: { period: 2, group: 15 },
  8: { period: 2, group: 16 },
  9: { period: 2, group: 17 },
  10: { period: 2, group: 18 },
  11: { period: 3, group: 1 },
  12: { period: 3, group: 2 },
  13: { period: 3, group: 13 },
  14: { period: 3, group: 14 },
  15: { period: 3, group: 15 },
  16: { period: 3, group: 16 },
  17: { period: 3, group: 17 },
  18: { period: 3, group: 18 },
  19: { period: 4, group: 1 },
  20: { period: 4, group: 2 },
  21: { period: 4, group: 3 },
  22: { period: 4, group: 4 },
  23: { period: 4, group: 5 },
  24: { period: 4, group: 6 },
  25: { period: 4, group: 7 },
  26: { period: 4, group: 8 },
  27: { period: 4, group: 9 },
  28: { period: 4, group: 10 },
  29: { period: 4, group: 11 },
  30: { period: 4, group: 12 },
  31: { period: 4, group: 13 },
  32: { period: 4, group: 14 },
  33: { period: 4, group: 15 },
  34: { period: 4, group: 16 },
  35: { period: 4, group: 17 },
  36: { period: 4, group: 18 },
  37: { period: 5, group: 1 },
  38: { period: 5, group: 2 },
  39: { period: 5, group: 3 },
  40: { period: 5, group: 4 },
  41: { period: 5, group: 5 },
  42: { period: 5, group: 6 },
  43: { period: 5, group: 7 },
  44: { period: 5, group: 8 },
  45: { period: 5, group: 9 },
  46: { period: 5, group: 10 },
  47: { period: 5, group: 11 },
  48: { period: 5, group: 12 },
  49: { period: 5, group: 13 },
  50: { period: 5, group: 14 },
  51: { period: 5, group: 15 },
  52: { period: 5, group: 16 },
  53: { period: 5, group: 17 },
  54: { period: 5, group: 18 },
  55: { period: 6, group: 1 },
  56: { period: 6, group: 2 },
  57: { period: 6, group: 3 },
  72: { period: 6, group: 4 },
  73: { period: 6, group: 5 },
  74: { period: 6, group: 6 },
  75: { period: 6, group: 7 },
  76: { period: 6, group: 8 },
  77: { period: 6, group: 9 },
  78: { period: 6, group: 10 },
  79: { period: 6, group: 11 },
  80: { period: 6, group: 12 },
  81: { period: 6, group: 13 },
  82: { period: 6, group: 14 },
  83: { period: 6, group: 15 },
  84: { period: 6, group: 16 },
  85: { period: 6, group: 17 },
  86: { period: 6, group: 18 },
  87: { period: 7, group: 1 },
  88: { period: 7, group: 2 },
  89: { period: 7, group: 3 },
  104: { period: 7, group: 4 },
  105: { period: 7, group: 5 },
  106: { period: 7, group: 6 },
  107: { period: 7, group: 7 },
  108: { period: 7, group: 8 },
  109: { period: 7, group: 9 },
  110: { period: 7, group: 10 },
  111: { period: 7, group: 11 },
  112: { period: 7, group: 12 },
  113: { period: 7, group: 13 },
  114: { period: 7, group: 14 },
  115: { period: 7, group: 15 },
  116: { period: 7, group: 16 },
  117: { period: 7, group: 17 },
  118: { period: 7, group: 18 },
};

const ELEMENTS_LIST = [
  { number: 1, symbol: "H", name: "Hydrogen", block: "s" },
  { number: 2, symbol: "He", name: "Helium", block: "s" },
  { number: 3, symbol: "Li", name: "Lithium", block: "s" },
  { number: 4, symbol: "Be", name: "Beryllium", block: "s" },
  { number: 5, symbol: "B", name: "Boron", block: "p" },
  { number: 6, symbol: "C", name: "Carbon", block: "p" },
  { number: 7, symbol: "N", name: "Nitrogen", block: "p" },
  { number: 8, symbol: "O", name: "Oxygen", block: "p" },
  { number: 9, symbol: "F", name: "Fluorine", block: "p" },
  { number: 10, symbol: "Ne", name: "Neon", block: "p" },
  { number: 11, symbol: "Na", name: "Sodium", block: "s" },
  { number: 12, symbol: "Mg", name: "Magnesium", block: "s" },
  { number: 13, symbol: "Al", name: "Aluminum", block: "p" },
  { number: 14, symbol: "Si", name: "Silicon", block: "p" },
  { number: 15, symbol: "P", name: "Phosphorus", block: "p" },
  { number: 16, symbol: "S", name: "Sulfur", block: "p" },
  { number: 17, symbol: "Cl", name: "Chlorine", block: "p" },
  { number: 18, symbol: "Ar", name: "Argon", block: "p" },
  { number: 19, symbol: "K", name: "Potassium", block: "s" },
  { number: 20, symbol: "Ca", name: "Calcium", block: "s" },
  { number: 21, symbol: "Sc", name: "Scandium", block: "d" },
  { number: 22, symbol: "Ti", name: "Titanium", block: "d" },
  { number: 23, symbol: "V", name: "Vanadium", block: "d" },
  { number: 24, symbol: "Cr", name: "Chromium", block: "d" },
  { number: 25, symbol: "Mn", name: "Manganese", block: "d" },
  { number: 26, symbol: "Fe", name: "Iron", block: "d" },
  { number: 27, symbol: "Co", name: "Cobalt", block: "d" },
  { number: 28, symbol: "Ni", name: "Nickel", block: "d" },
  { number: 29, symbol: "Cu", name: "Copper", block: "d" },
  { number: 30, symbol: "Zn", name: "Zinc", block: "d" },
  { number: 31, symbol: "Ga", name: "Gallium", block: "p" },
  { number: 32, symbol: "Ge", name: "Germanium", block: "p" },
  { number: 33, symbol: "As", name: "Arsenic", block: "p" },
  { number: 34, symbol: "Se", name: "Selenium", block: "p" },
  { number: 35, symbol: "Br", name: "Bromine", block: "p" },
  { number: 36, symbol: "Kr", name: "Krypton", block: "p" },
  { number: 37, symbol: "Rb", name: "Rubidium", block: "s" },
  { number: 38, symbol: "Sr", name: "Strontium", block: "s" },
  { number: 39, symbol: "Y", name: "Yttrium", block: "d" },
  { number: 40, symbol: "Zr", name: "Zirconium", block: "d" },
  { number: 41, symbol: "Nb", name: "Niobium", block: "d" },
  { number: 42, symbol: "Mo", name: "Molybdenum", block: "d" },
  { number: 43, symbol: "Tc", name: "Technetium", block: "d" },
  { number: 44, symbol: "Ru", name: "Ruthenium", block: "d" },
  { number: 45, symbol: "Rh", name: "Rhodium", block: "d" },
  { number: 46, symbol: "Pd", name: "Palladium", block: "d" },
  { number: 47, symbol: "Ag", name: "Silver", block: "d" },
  { number: 48, symbol: "Cd", name: "Cadmium", block: "d" },
  { number: 49, symbol: "In", name: "Indium", block: "p" },
  { number: 50, symbol: "Sn", name: "Tin", block: "p" },
  { number: 51, symbol: "Sb", name: "Antimony", block: "p" },
  { number: 52, symbol: "Te", name: "Tellurium", block: "p" },
  { number: 53, symbol: "I", name: "Iodine", block: "p" },
  { number: 54, symbol: "Xe", name: "Xenon", block: "p" },
  { number: 55, symbol: "Cs", name: "Cesium", block: "s" },
  { number: 56, symbol: "Ba", name: "Barium", block: "s" },
  { number: 57, symbol: "La", name: "Lanthanum", block: "f" },
  { number: 58, symbol: "Ce", name: "Cerium", block: "f" },
  { number: 59, symbol: "Pr", name: "Praseodymium", block: "f" },
  { number: 60, symbol: "Nd", name: "Neodymium", block: "f" },
  { number: 61, symbol: "Pm", name: "Promethium", block: "f" },
  { number: 62, symbol: "Sm", name: "Samarium", block: "f" },
  { number: 63, symbol: "Eu", name: "Europium", block: "f" },
  { number: 64, symbol: "Gd", name: "Gadolinium", block: "f" },
  { number: 65, symbol: "Tb", name: "Terbium", block: "f" },
  { number: 66, symbol: "Dy", name: "Dysprosium", block: "f" },
  { number: 67, symbol: "Ho", name: "Holmium", block: "f" },
  { number: 68, symbol: "Er", name: "Erbium", block: "f" },
  { number: 69, symbol: "Tm", name: "Thulium", block: "f" },
  { number: 70, symbol: "Yb", name: "Ytterbium", block: "f" },
  { number: 71, symbol: "Lu", name: "Lutetium", block: "f" },
  { number: 72, symbol: "Hf", name: "Hafnium", block: "d" },
  { number: 73, symbol: "Ta", name: "Tantalum", block: "d" },
  { number: 74, symbol: "W", name: "Tungsten", block: "d" },
  { number: 75, symbol: "Re", name: "Rhenium", block: "d" },
  { number: 76, symbol: "Os", name: "Osmium", block: "d" },
  { number: 77, symbol: "Ir", name: "Iridium", block: "d" },
  { number: 78, symbol: "Pt", name: "Platinum", block: "d" },
  { number: 79, symbol: "Au", name: "Gold", block: "d" },
  { number: 80, symbol: "Hg", name: "Mercury", block: "d" },
  { number: 81, symbol: "Tl", name: "Thallium", block: "p" },
  { number: 82, symbol: "Pb", name: "Lead", block: "p" },
  { number: 83, symbol: "Bi", name: "Bismuth", block: "p" },
  { number: 84, symbol: "Po", name: "Polonium", block: "p" },
  { number: 85, symbol: "At", name: "Astatine", block: "p" },
  { number: 86, symbol: "Rn", name: "Radon", block: "p" },
  { number: 87, symbol: "Fr", name: "Francium", block: "s" },
  { number: 88, symbol: "Ra", name: "Radium", block: "s" },
  { number: 89, symbol: "Ac", name: "Actinium", block: "f" },
  { number: 90, symbol: "Th", name: "Thorium", block: "f" },
  { number: 91, symbol: "Pa", name: "Protactinium", block: "f" },
  { number: 92, symbol: "U", name: "Uranium", block: "f" },
  { number: 93, symbol: "Np", name: "Neptunium", block: "f" },
  { number: 94, symbol: "Pu", name: "Plutonium", block: "f" },
  { number: 95, symbol: "Am", name: "Americium", block: "f" },
  { number: 96, symbol: "Cm", name: "Curium", block: "f" },
  { number: 97, symbol: "Bk", name: "Berkelium", block: "f" },
  { number: 98, symbol: "Cf", name: "Californium", block: "f" },
  { number: 99, symbol: "Es", name: "Einsteinium", block: "f" },
  { number: 100, symbol: "Fm", name: "Fermium", block: "f" },
  { number: 101, symbol: "Md", name: "Mendelevium", block: "f" },
  { number: 102, symbol: "No", name: "Nobelium", block: "f" },
  { number: 103, symbol: "Lr", name: "Lawrencium", block: "f" },
  { number: 104, symbol: "Rf", name: "Rutherfordium", block: "d" },
  { number: 105, symbol: "Db", name: "Dubnium", block: "d" },
  { number: 106, symbol: "Sg", name: "Seaborgium", block: "d" },
  { number: 107, symbol: "Bh", name: "Bohrium", block: "d" },
  { number: 108, symbol: "Hs", name: "Hassium", block: "d" },
  { number: 109, symbol: "Mt", name: "Meitnerium", block: "d" },
  { number: 110, symbol: "Ds", name: "Darmstadtium", block: "d" },
  { number: 111, symbol: "Rg", name: "Roentgenium", block: "d" },
  { number: 112, symbol: "Cn", name: "Copernicium", block: "d" },
  { number: 113, symbol: "Nh", name: "Nihonium", block: "p" },
  { number: 114, symbol: "Fl", name: "Flerovium", block: "p" },
  { number: 115, symbol: "Mc", name: "Moscovium", block: "p" },
  { number: 116, symbol: "Lv", name: "Livermorium", block: "p" },
  { number: 117, symbol: "Ts", name: "Tennessine", block: "p" },
  { number: 118, symbol: "Og", name: "Oganesson", block: "p" },
];

export function getElements() {
  return ELEMENTS_LIST.map((e) => ({
    ...e,
    ...getGridPosition(e.number),
  }));
}

export function getFact(number) {
  return ELEMENT_FACTS[number] ?? null;
}

/** Maximum electrons per shell (Bohr model): n=1,2,3,4,5,6,7 */
const SHELL_CAPACITIES = [2, 8, 8, 18, 18, 32, 32];

/** Returns array of electrons per shell, e.g. [2, 8, 1] for sodium (11). */
export function getElectronShells(atomicNumber) {
  const shells = [];
  let remaining = atomicNumber;
  for (const cap of SHELL_CAPACITIES) {
    if (remaining <= 0) break;
    shells.push(Math.min(remaining, cap));
    remaining -= cap;
  }
  return shells;
}

export function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Map (row, col) to atomic number for placement check. Row/col 1-based. */
const SLOT_TO_NUMBER = (() => {
  const map = new Map();
  const elements = ELEMENTS_LIST.map((e) => ({ ...e, ...getGridPosition(e.number) }));
  elements.forEach((e) => map.set(`${e.row},${e.col}`, e.number));
  return map;
})();

export function getNumberAtSlot(row, col) {
  return SLOT_TO_NUMBER.get(`${row},${col}`) ?? null;
}

/** All (row, col) slots that exist on the grid (1-based). */
export function getAllSlots() {
  return ELEMENTS_LIST.map((e) => {
    const pos = getGridPosition(e.number);
    return { row: pos.row, col: pos.col, number: e.number, block: e.block, symbol: e.symbol };
  });
}

/** 9×18 grid: grid[row-1][col-1] is null or { number, block, symbol }. */
export function getGridMatrix() {
  const matrix = Array.from({ length: 9 }, () => Array.from({ length: 18 }, () => null));
  ELEMENTS_LIST.forEach((e) => {
    const pos = getGridPosition(e.number);
    matrix[pos.row - 1][pos.col - 1] = { number: e.number, block: e.block, symbol: e.symbol };
  });
  return matrix;
}
