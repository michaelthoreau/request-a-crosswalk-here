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
  loadMapLibre,
  loadView,
  saveView,
  toFeatureCollection,
} from "./map-utils"

type Props = {
  points: CrosswalkPoint[]
  value: LatLng | null
  onChange: (value: LatLng) => void
  className?: string
}

export function LocationPicker({ points, value, onChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    loadMapLibre().then((maplibregl) => {
      if (cancelled || !containerRef.current) return
      const initial = valueRef.current
      const saved = loadView()
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        attributionControl: { compact: true },
        ...(initial
          ? { center: [initial.lng, initial.lat] as [number, number], zoom: 17 }
          : (saved ?? WORLD_VIEW)),
      })
      mapRef.current = map
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }))
      map.addControl(
        new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } })
      )
      map.on("moveend", () => saveView(map))
      if (!initial && !saved && points.length > 0) {
        map.fitBounds(boundsOf(points), { padding: 60, maxZoom: 15, duration: 0 })
      }

      const marker = new maplibregl.Marker({ color: MARKER_HIGHLIGHT_COLOR, draggable: true })
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLngLat()
        onChangeRef.current({ lat, lng })
      })
      markerRef.current = marker
      if (initial) marker.setLngLat([initial.lng, initial.lat]).addTo(map)

      map.on("click", (e) => onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }))
      map.on("load", () => {
        map.addSource("crosswalks", { type: "geojson", data: toFeatureCollection(points) })
        map.addLayer({
          id: "crosswalks",
          type: "circle",
          source: "crosswalks",
          paint: {
            "circle-color": MARKER_COLOR,
            "circle-radius": 6,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        })
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [points])

  useEffect(() => {
    valueRef.current = value
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (value) marker.setLngLat([value.lng, value.lat]).addTo(map)
    else marker.remove()
  }, [value])

  return <div ref={containerRef} className={cn("h-full w-full", className)} />
}
