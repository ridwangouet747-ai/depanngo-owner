export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Centre approximatif de San Pedro, Côte d'Ivoire
export const SAN_PEDRO_CENTER = { lat: 4.7485, lng: -6.6363 };

export const QUARTIERS_SAN_PEDRO = [
  "Bardot",
  "Cité",
  "Kpwesso",
  "Moro",
  "Lac",
  "Zone Industrielle",
  "San Pedro Port",
] as const;
