// Great-circle distance between two lat/lng points, kilometers.
// Returns null if either input is non-finite.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const a = Number(lat1), b = Number(lng1), c = Number(lat2), d = Number(lng2)
  if (![a, b, c, d].every(Number.isFinite)) return null
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(c - a)
  const dLng = toRad(d - b)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(Math.max(1 - s, 0)))
}
