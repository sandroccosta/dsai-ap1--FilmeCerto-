/**
 * Streamings por assinatura no Brasil, com o ID, o nome e o logo do provedor no TMDB
 * (`/watch/providers/movie?watch_region=BR`), na ordem de exibição.
 * `tests/integration/preferencias/streamings-tmdb.test.ts` confere a constante contra a API.
 */
export const STREAMINGS = [
  { id: 8, nome: "Netflix", logoPath: "/rK1KljqmbvO9HQa1PBFLILWah72.png" },
  { id: 119, nome: "Amazon Prime Video", logoPath: "/gMZdpavHmxFNnLpMHwVxfqeux2g.png" },
  { id: 337, nome: "Disney Plus", logoPath: "/5eZ872CghnHFLB1j8grszbrx0dx.png" },
  { id: 1899, nome: "HBO Max", logoPath: "/skypuy7SXuugIQeYg0IglmzoKaS.png" },
  { id: 307, nome: "Globoplay", logoPath: "/9A6Oxd3F7iXm7mds7CxYOBicojs.png" },
  { id: 350, nome: "Apple TV", logoPath: "/9icYBfYFcwgCbky5VdGUIKJ4C5i.png" },
  { id: 531, nome: "Paramount Plus", logoPath: "/pkx3klJlwW5JdtaulvDx6hDNtch.png" },
  { id: 283, nome: "Crunchyroll", logoPath: "/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png" },
  { id: 11, nome: "MUBI", logoPath: "/k7iSlvgWzZuO4zU5PcBjhABMuia.png" },
] as const;

export type Streaming = (typeof STREAMINGS)[number];

export const IDS_STREAMINGS: ReadonlySet<number> = new Set(STREAMINGS.map((s) => s.id));

export const MAX_STREAMINGS = 10;
