import type { CrosswalkPoint } from "@/lib/crosswalks"

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty"
export const WORLD_VIEW = { center: [-30, 30] as [number, number], zoom: 1.4 }

export const MARKER_COLOR = "#3b7a4f"
export const MARKER_HIGHLIGHT_COLOR = "#105028"

export const loadMapLibre = () => import("maplibre-gl").then((m) => m.default ?? m)

type MapView = { center: [number, number]; zoom: number }
const VIEW_KEY = "rach:map-view"

// Last view the user looked at, so the request map opens where they were browsing.
export function saveView(map: { getCenter(): { lng: number; lat: number }; getZoom(): number }) {
  const { lng, lat } = map.getCenter()
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify({ center: [lng, lat], zoom: map.getZoom() }))
  } catch {}
}

export function loadView(): MapView | null {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "null")
    const valid =
      Array.isArray(v?.center) &&
      v.center.length === 2 &&
      v.center.every(Number.isFinite) &&
      Number.isFinite(v.zoom)
    return valid ? { center: v.center, zoom: v.zoom } : null
  } catch {
    return null
  }
}

export function toFeatureCollection(points: CrosswalkPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      properties: { id: p.id, label: p.label, count: p.supporterCount },
    })),
  }
}

export function boundsOf(points: { lat: number; lng: number }[]) {
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ] as [[number, number], [number, number]]
}
