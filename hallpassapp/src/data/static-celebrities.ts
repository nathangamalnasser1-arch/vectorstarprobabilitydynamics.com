/**
 * Fallback catalog when Supabase is unavailable (and for overlap labels in demo data).
 * DB search uses `celebrities` when configured.
 */
export const STATIC_CELEBRITY_ENTRIES: { id: string; name: string }[] = [
  { id: "c-ryan", name: "Ryan Gosling" },
  { id: "c-brad", name: "Brad Pitt" },
  { id: "c-scarlett", name: "Scarlett Johansson" },
  { id: "c-margot", name: "Margot Robbie" },
  { id: "c-timothee", name: "Timothée Chalamet" },
  { id: "c-zendaya", name: "Zendaya" },
  { id: "c-chris-h", name: "Chris Hemsworth" },
  { id: "c-chris-e", name: "Chris Evans" },
  { id: "c-robert", name: "Robert Downey Jr." },
  { id: "c-tom-h", name: "Tom Holland" },
  { id: "c-florence", name: "Florence Pugh" },
  { id: "c-anya", name: "Anya Taylor-Joy" },
  { id: "c-sydney", name: "Sydney Sweeney" },
  { id: "c-pedro", name: "Pedro Pascal" },
  { id: "c-oscar", name: "Oscar Isaac" },
  { id: "c-rihanna", name: "Rihanna" },
  { id: "c-beyonce", name: "Beyoncé" },
  { id: "c-taylor-s", name: "Taylor Swift" },
  { id: "c-bad-bunny", name: "Bad Bunny" },
  { id: "c-dua", name: "Dua Lipa" },
  { id: "c-harry-s", name: "Harry Styles" },
  { id: "c-jennifer-l", name: "Jennifer Lawrence" },
  { id: "c-emma-s", name: "Emma Stone" },
  { id: "c-natalie", name: "Natalie Portman" },
  { id: "c-anne", name: "Anne Hathaway" },
  { id: "c-keanu", name: "Keanu Reeves" },
  { id: "c-idris", name: "Idris Elba" },
  { id: "c-michael-b", name: "Michael B. Jordan" },
  { id: "c-zoe", name: "Zoë Kravitz" },
  { id: "c-lupita", name: "Lupita Nyong’o" },
  { id: "c-dev", name: "Dev Patel" },
  { id: "c-simone", name: "Simu Liu" },
  { id: "c-austin", name: "Austin Butler" },
  { id: "c-jacob", name: "Jacob Elordi" },
  { id: "c-sadie", name: "Sadie Sink" },
  { id: "c-jenna", name: "Jenna Ortega" },
].sort((a, b) => a.name.localeCompare(b.name));

export function staticCelebrityNameById(id: string): string | undefined {
  return STATIC_CELEBRITY_ENTRIES.find((e) => e.id === id)?.name;
}
