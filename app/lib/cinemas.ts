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
  { id: "event-george-st", name: "Event George St", short: "George St", chain: "Event", suburb: "Sydney", lat: -33.8746, lng: 151.2065, url: "https://www.eventcinemas.com.au", query: "Event Cinemas George Street Sydney showtimes" },
  { id: "palace-central", name: "Palace Central", short: "Central", chain: "Palace", suburb: "Chippendale", lat: -33.8843, lng: 151.1995, url: "https://www.palacecinemas.com.au", query: "Palace Central Sydney showtimes" },
  { id: "hoyts-eq", name: "Hoyts Entertainment Quarter", short: "Hoyts EQ", chain: "Hoyts", suburb: "Moore Park", lat: -33.8913, lng: 151.2253, url: "https://www.hoyts.com.au", query: "Hoyts Entertainment Quarter Moore Park showtimes" },
  { id: "dendy-newtown", name: "Dendy Newtown", short: "Newtown", chain: "Dendy", suburb: "Newtown", lat: -33.8968, lng: 151.1794, url: "https://www.dendy.com.au", query: "Dendy Cinemas Newtown showtimes" },
  { id: "ritz-randwick", name: "Ritz Cinema", short: "Ritz", chain: "Ritz", suburb: "Randwick", lat: -33.9213, lng: 151.2412, url: "https://www.ritzcinemas.com.au", query: "Ritz Cinema Randwick showtimes" },
  { id: "hayden-orpheum", name: "Hayden Orpheum", short: "Orpheum", chain: "Orpheum", suburb: "Cremorne", lat: -33.8299, lng: 151.2272, url: "https://www.orpheum.com.au", query: "Hayden Orpheum Cremorne showtimes" },
  { id: "palace-norton-st", name: "Palace Norton Street", short: "Norton St", chain: "Palace", suburb: "Leichhardt", lat: -33.8828, lng: 151.1566, url: "https://www.palacecinemas.com.au", query: "Palace Norton Street showtimes" },
];
