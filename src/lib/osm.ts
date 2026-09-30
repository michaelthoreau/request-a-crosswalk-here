import "server-only"
import { distanceMeters, distanceToSegmentMeters, type LatLng } from "./geo"

// The public Overpass instances are flaky, so try a mirror before giving up.
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
]
const USER_AGENT = "requestacrosswalkhere.org (crosswalk request mapper)"

// Within this distance of an intersection, name the crosswalk "A & B".
const INTERSECTION_SNAP_M = 60
const SEARCH_RADIUS_M = 150
// Past this, give up on street names; the crosswalk gets a random ID instead.
const LOOKUP_DEADLINE_MS = 10_000
const PER_MIRROR_TIMEOUT_MS = 6_000

const STREET_TYPES = [
  "trunk",
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "living_street",
  "pedestrian",
  "trunk_link",
  "primary_link",
  "secondary_link",
  "tertiary_link",
].join("|")

type OverpassWay = {
  type: "way"
  id: number
  nodes: number[]
  geometry: { lat: number; lon: number }[]
  tags: Record<string, string>
}
type OverpassArea = { type: "area"; id: number; tags: Record<string, string> }
type OverpassResponse = { elements: (OverpassWay | OverpassArea)[] }

export type PlaceDescription = {
  label: string | null
  locality: string | null
}

export async function describePlace(point: LatLng): Promise<PlaceDescription> {
  const { lat, lng } = point
  const query = `[out:json][timeout:10];
way(around:${SEARCH_RADIUS_M},${lat},${lng})["highway"~"^(${STREET_TYPES})$"]["name"];
out geom;
is_in(${lat},${lng})->.a;
area.a["boundary"="administrative"]["admin_level"~"^(4|6|7|8)$"]["name"];
out tags;`

  const data = await queryOverpass(query)
  if (!data) return { label: null, locality: null }

  const ways = data.elements.filter((e): e is OverpassWay => e.type === "way")
  const areas = data.elements.filter((e): e is OverpassArea => e.type === "area")

  return {
    label: nameFromStreets(point, ways),
    locality: localityFromAreas(areas),
  }
}

async function queryOverpass(query: string): Promise<OverpassResponse | null> {
  const deadline = AbortSignal.timeout(LOOKUP_DEADLINE_MS)
  for (const url of OVERPASS_URLS) {
    if (deadline.aborted) break
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.any([deadline, AbortSignal.timeout(PER_MIRROR_TIMEOUT_MS)]),
      })
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      return await res.json()
    } catch (error) {
      console.error(`Overpass lookup failed at ${url}`, error)
    }
  }
  return null
}

function nameFromStreets(point: LatLng, ways: OverpassWay[]): string | null {
  const streetDistance = new Map<string, number>()
  const nodes = new Map<number, { at: LatLng; names: Set<string> }>()

  for (const way of ways) {
    const name = way.tags.name
    const coords = way.geometry.map((g) => ({ lat: g.lat, lng: g.lon }))

    let best = Infinity
    for (let i = 1; i < coords.length; i++) {
      best = Math.min(best, distanceToSegmentMeters(point, coords[i - 1], coords[i]))
    }
    streetDistance.set(name, Math.min(best, streetDistance.get(name) ?? Infinity))

    way.nodes.forEach((nodeId, i) => {
      const entry = nodes.get(nodeId) ?? { at: coords[i], names: new Set() }
      entry.names.add(name)
      nodes.set(nodeId, entry)
    })
  }

  const byDistance = (a: string, b: string) =>
    (streetDistance.get(a) ?? Infinity) - (streetDistance.get(b) ?? Infinity)
  const primary = [...streetDistance.keys()].sort(byDistance)[0]
  if (!primary) return null

  let crossing: { street: string; distance: number } | null = null
  for (const { at, names } of nodes.values()) {
    if (names.size < 2 || !names.has(primary)) continue
    const distance = distanceMeters(point, at)
    if (crossing && crossing.distance <= distance) continue
    const other = [...names].filter((n) => n !== primary).sort(byDistance)[0]
    crossing = { street: other, distance }
  }

  if (!crossing) return primary
  const joiner = crossing.distance <= INTERSECTION_SNAP_M ? "&" : "near"
  return `${primary} ${joiner} ${crossing.street}`
}

function localityFromAreas(areas: OverpassArea[]) {
  const byLevel = new Map(areas.map((a) => [a.tags.admin_level, a.tags]))
  const city = byLevel.get("8") ?? byLevel.get("7") ?? byLevel.get("6")
  const region = byLevel.get("4")
  const regionCode = region?.["ISO3166-2"]?.split("-")[1]
  const regionName = regionCode && regionCode.length <= 3 ? regionCode : region?.name
  return [city?.name, regionName].filter(Boolean).join(", ") || null
}
