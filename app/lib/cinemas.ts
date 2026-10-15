// The 7 cinemas we fetch real sessions for. SerpAPI's free plan is 250 searches a
// month; 7 cinemas × 31 days = 217, which leaves room for retries.
// `query` is the Google search that returns the cinema's showtimes card.

export type Cinema = {
  id: string;
  name: string;
  short: string;
  chain: string;
  suburb: string;
  lat: number;
  lng: number;
  url: string; // booking happens on the chain's own site
  query: string;
};

export const CINEMAS: Cinema[] = [
  { id: "cinema-nova", name: "Cinema Nova", short: "Nova", chain: "Cinema Nova", suburb: "Carlton", lat: -37.7983, lng: 144.9671, url: "https://www.cinemanova.com.au", query: "Cinema Nova Carlton showtimes" },
  { id: "hoyts-melbourne-central", name: "Hoyts Melbourne Central", short: "Hoyts MC", chain: "Hoyts", suburb: "CBD", lat: -37.8102, lng: 144.9628, url: "https://www.hoyts.com.au", query: "Hoyts Melbourne Central showtimes" },
  { id: "village-crown", name: "Village Crown", short: "Crown", chain: "Village", suburb: "Southbank", lat: -37.8237, lng: 144.958, url: "https://villagecinemas.com.au", query: "Village Cinemas Crown showtimes" },
  { id: "palace-westgarth", name: "Palace Westgarth", short: "Westgarth", chain: "Palace", suburb: "Northcote", lat: -37.7786, lng: 144.9989, url: "https://www.palacecinemas.com.au", query: "Palace Westgarth showtimes" },
  { id: "lido", name: "Lido Cinemas", short: "Lido", chain: "Lido", suburb: "Hawthorn", lat: -37.8217, lng: 145.0315, url: "https://www.lidocinemas.com.au", query: "Lido Cinemas Hawthorn showtimes" },
  { id: "hoyts-highpoint", name: "Hoyts Highpoint", short: "Highpoint", chain: "Hoyts", suburb: "Maribyrnong", lat: -37.7738, lng: 144.888, url: "https://www.hoyts.com.au", query: "Hoyts Highpoint showtimes" },
  { id: "hoyts-chadstone", name: "Hoyts Chadstone", short: "Chadstone", chain: "Hoyts", suburb: "Chadstone", lat: -37.8862, lng: 145.083, url: "https://www.hoyts.com.au", query: "Hoyts Chadstone showtimes" },
];
