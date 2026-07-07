/**
 * Builds a Google Maps search link from a free-text address — no geocoding,
 * no API key. Used to make coach-entered hotel/venue addresses tappable.
 */
export function googleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
