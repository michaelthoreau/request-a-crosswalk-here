export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180

export function distanceMeters(a: LatLng, b: LatLng) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Equirectangular projection around `p`; accurate enough at street scale.
export function distanceToSegmentMeters(p: LatLng, a: LatLng, b: LatLng) {
  const kx = Math.cos(toRad(p.lat)) * EARTH_RADIUS_M
  const ky = EARTH_RADIUS_M
  const ax = toRad(a.lng - p.lng) * kx
  const ay = toRad(a.lat - p.lat) * ky
  const bx = toRad(b.lng - p.lng) * kx
  const by = toRad(b.lat - p.lat) * ky
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

export function boundingBox(center: LatLng, radiusM: number) {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng = dLat / Math.max(Math.cos(toRad(center.lat)), 0.01)
  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  }
}
