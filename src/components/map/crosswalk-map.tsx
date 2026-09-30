"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import type { Map as MapLibreMap, Marker } from "maplibre-gl"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { CrosswalkPoint } from "@/lib/crosswalks"
import type { LatLng } from "@/lib/geo"
import {
  MAP_STYLE,
  MARKER_COLOR,
  MARKER_HIGHLIGHT_COLOR,
  WORLD_VIEW,
  boundsOf,
  crosswalkPopupContent,
  loadMapLibre,
  loadView,
  saveView,
  toFeatureCollection,
} from "./map-utils"

type Props = {
  points: CrosswalkPoint[]
  /** Centers the map here instead of fitting to all points. */
  focus?: { lat: number; lng: number; id?: string }
  interactive?: boolean
  /** Tap on empty map (not on an existing crosswalk). */
  onMapClick?: (point: LatLng) => void
  pin?: LatLng | null
  className?: string
}

export function CrosswalkMap({
  points,
  focus,
  interactive = true,
  onMapClick,
  pin,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onMapClickRef = useRef(onMapClick)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (pin) marker.setLngLat([pin.lng, pin.lat]).addTo(map)
    else marker.remove()
  }, [pin])

  useEffect(() => {
    let map: MapLibreMap | undefined
    let cancelled = false

    loadMapLibre().then((maplibregl) => {
      if (cancelled || !containerRef.current) return
      const saved = focus ? null : loadView()
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        interactive,
        // Embedded in a scrolling page, so don't hijack the scroll wheel.
        cooperativeGestures: !!focus,
        attributionControl: { compact: true },
        ...(focus
          ? { center: [focus.lng, focus.lat], zoom: 16 }
          : (saved ?? WORLD_VIEW)),
      })
      mapRef.current = map
      markerRef.current = new maplibregl.Marker({ color: MARKER_HIGHLIGHT_COLOR })
      if (interactive) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }))
        map.addControl(new maplibregl.GeolocateControl({}))
        map.on("moveend", () => saveView(map!))
        map.on("click", (e) => {
          const onCrosswalk = map!.getLayer("crosswalks")
            ? map!.queryRenderedFeatures(e.point, { layers: ["crosswalks"] }).length > 0
            : false
          if (!onCrosswalk) onMapClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        })
      }
      if (!focus && !saved && points.length > 0) {
        map.fitBounds(boundsOf(points), { padding: 60, maxZoom: 15, duration: 0 })
      }

      map.on("load", () => {
        if (!map) return
        map.addSource("crosswalks", { type: "geojson", data: toFeatureCollection(points) })
        map.addLayer({
          id: "crosswalks",
          type: "circle",
          source: "crosswalks",
          paint: {
            "circle-color": [
              "case",
              ["==", ["get", "id"], focus?.id ?? ""],
              MARKER_HIGHLIGHT_COLOR,
              MARKER_COLOR,
            ],
            "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 7, 50, 16],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        })

        if (!interactive) return
        map.on("mouseenter", "crosswalks", () => {
          map!.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "crosswalks", () => {
          map!.getCanvas().style.cursor = ""
        })
        map.on("click", "crosswalks", (e) => {
          const feature = e.features?.[0]
          if (!feature || feature.geometry.type !== "Point") return
          new maplibregl.Popup({ offset: 12 })
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setDOMContent(crosswalkPopupContent(feature.properties))
            .addTo(map!)
        })
      })
    })

    return () => {
      cancelled = true
      map?.remove()
      mapRef.current = null
    }
  }, [points, focus, interactive])

  return <div ref={containerRef} className={cn("h-full w-full", className)} />
}
