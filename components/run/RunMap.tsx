"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface Props {
  points: { lat: number; lng: number }[];
  currentPos: { lat: number; lng: number } | null;
  isLive: boolean;
}

export default function RunMap({ points, currentPos, isLive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onTouchStartRef = useRef<((e: TouchEvent) => void) | null>(null);
  const onTouchEndRef = useRef<(() => void) | null>(null);
  const lRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    // dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      if (!mounted || !containerRef.current) return; // bail if unmounted before promise resolved
      // fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center = currentPos ?? (points[0] ?? { lat: 51.505, lng: -0.09 });
      const map = L.map(containerRef.current!, {
        center: [center.lat, center.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        dragging: false, // start with dragging off; only enable on two-finger touch
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latlngs, { color: "#79addc", weight: 4 }).addTo(map);
      polylineRef.current = polyline;

      if (currentPos) {
        const marker = L.circleMarker([currentPos.lat, currentPos.lng], {
          radius: 8,
          color: "#fff",
          weight: 2,
          fillColor: "#79addc",
          fillOpacity: 1,
        }).addTo(map);
        markerRef.current = marker;
      }

      mapRef.current = map;
      lRef.current = L;

      // Two-finger drag: enable dragging only when 2+ touches detected
      const el = containerRef.current!;
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length >= 2) map.dragging.enable();
        else map.dragging.disable();
      };
      const onTouchEnd = () => map.dragging.disable();
      onTouchStartRef.current = onTouchStart;
      onTouchEndRef.current = onTouchEnd;
      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchend", onTouchEnd, { passive: true });
    });

    return () => {
      mounted = false;
      if (containerRef.current) {
        if (onTouchStartRef.current) containerRef.current.removeEventListener("touchstart", onTouchStartRef.current);
        if (onTouchEndRef.current) containerRef.current.removeEventListener("touchend", onTouchEndRef.current);
      }
      mapRef.current?.remove();
      mapRef.current = null;
      lRef.current = null;
      polylineRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = lRef.current;
    if (!mapRef.current || !L) return;
    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latlngs);
    }
    if (currentPos) {
      if (markerRef.current) {
        markerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
      } else {
        markerRef.current = L.circleMarker([currentPos.lat, currentPos.lng], {
          radius: 8,
          color: "#fff",
          weight: 2,
          fillColor: "#79addc",
          fillOpacity: 1,
        }).addTo(mapRef.current);
        mapRef.current.panTo([currentPos.lat, currentPos.lng]);
      }
      if (isLive) {
        mapRef.current.panTo([currentPos.lat, currentPos.lng]);
      }
    }
  }, [points, currentPos, isLive]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
