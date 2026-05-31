import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WorldMapProps } from "../dashboard.types";
import { TYPE_COLORS, SEV_OPACITY, TARGETS, MOCK_EVENTS } from "../dashboard.constants";

export function WorldMap({ activeTypes, activeSevs, onNewEvent }: WorldMapProps) {
    const containerRef   = useRef<HTMLDivElement>(null);
    const mapRef         = useRef<L.Map | null>(null);
    const layerRef       = useRef<L.LayerGroup | null>(null);
    const tgtMarkersRef  = useRef<Record<number, L.Marker>>({});
    const activeTypesRef = useRef(activeTypes);
    const activeSevRef   = useRef(activeSevs);
    const onNewEventRef  = useRef(onNewEvent);

    useEffect(() => { activeTypesRef.current = activeTypes; }, [activeTypes]);
    useEffect(() => { activeSevRef.current   = activeSevs;  }, [activeSevs]);
    useEffect(() => { onNewEventRef.current  = onNewEvent;  }, [onNewEvent]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [20, 15], zoom: 2, minZoom: 2, maxZoom: 6,
            zoomControl: false, attributionControl: false,
            renderer: L.svg(), dragging: false, scrollWheelZoom: true,
            maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
            maxBoundsViscosity: 1.0,
        });
        mapRef.current = map;

        map.on("zoomend", () => {
            if (map.getZoom() > 2) {
                map.dragging.enable();
            } else {
                map.dragging.disable();
                map.setView([20, 15], 2);
            }
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;

        const tgtIcon = L.divIcon({ className: "db-tgt-marker", iconSize: [20, 20], iconAnchor: [10, 10] });
        TARGETS.forEach((t, idx) => {
            const m = L.marker([t.lat, t.lng], { icon: tgtIcon, zIndexOffset: 500 })
                .addTo(map)
                .bindTooltip(`TARGET :: ${t.label}`, {
                    permanent: false, direction: "right",
                    className: "db-tgt-tooltip", offset: [14, 0],
                });
            tgtMarkersRef.current[idx] = m;
        });

        const fireAttack = (ev: (typeof MOCK_EVENTS)[0]) => {
            const tgt    = TARGETS[ev.tgtIdx ?? 0];
            const src: [number, number]   = [ev.srcLat, ev.srcLng];
            const tgtPt: [number, number] = [tgt.lat, tgt.lng];
            const color   = TYPE_COLORS[ev.type];
            const opacity = SEV_OPACITY[ev.severity];

            const dist    = Math.sqrt((tgtPt[0] - src[0]) ** 2 + (tgtPt[1] - src[1]) ** 2);
            const ctrlLat = (src[0] + tgtPt[0]) / 2 + Math.max(dist * 0.28, 14);
            const ctrlLng = (src[1] + tgtPt[1]) / 2;

            const pts: [number, number][] = [];
            for (let i = 0; i <= 40; i++) {
                const t = i / 40;
                pts.push([
                    (1 - t) ** 2 * src[0] + 2 * (1 - t) * t * ctrlLat + t ** 2 * tgtPt[0],
                    (1 - t) ** 2 * src[1] + 2 * (1 - t) * t * ctrlLng + t ** 2 * tgtPt[1],
                ]);
            }

            const halo = L.polyline(pts, { color, weight: 7, opacity: 0 }).addTo(layer);
            setTimeout(() => halo.setStyle({ opacity: opacity * 0.15 }), 60);

            const arc = L.polyline(pts, { color, weight: 1.6, opacity: 0 }).addTo(layer);
            setTimeout(() => {
                const el = arc.getElement() as SVGPathElement | undefined;
                if (!el) { arc.setStyle({ opacity: opacity * 0.9, dashArray: "5 8" }); return; }
                const len = el.getTotalLength();
                el.style.strokeDasharray  = String(len);
                el.style.strokeDashoffset = String(len);
                arc.setStyle({ opacity });
                void el.getBoundingClientRect();
                el.style.transition       = "stroke-dashoffset 1.4s ease-out";
                el.style.strokeDashoffset = "0";
            }, 80);

            const srcIcon = L.divIcon({
                className: "",
                html: `<div class="db-src-ping" style="--c:${color}"><div class="db-src-dot"></div><div class="db-src-ring"></div></div>`,
                iconSize: [24, 24], iconAnchor: [12, 12],
            });
            const srcMarker = L.marker(src, { icon: srcIcon, zIndexOffset: 200 }).addTo(layer);

            let step = 0;
            const move = setInterval(() => {
                step++;
                if (step >= pts.length) {
                    clearInterval(move);
                    srcMarker.remove();

                    Object.values(tgtMarkersRef.current).forEach(m => m.closeTooltip());
                    const tgtM = tgtMarkersRef.current[ev.tgtIdx ?? 0];
                    if (tgtM) {
                        tgtM.openTooltip();
                        setTimeout(() => tgtM.closeTooltip(), 2000);
                    }

                    const flash = L.circleMarker(tgtPt, {
                        radius: 5, color, fillColor: color, fillOpacity: 0.25, weight: 2, opacity: 1,
                    }).addTo(layer);
                    let fr = 5, fa = 1;
                    const expand = setInterval(() => {
                        fr += 1.8; fa -= 0.07;
                        if (fa <= 0) { clearInterval(expand); flash.remove(); return; }
                        flash.setRadius(fr);
                        flash.setStyle({ opacity: fa, fillOpacity: fa * 0.2 });
                    }, 25);

                    setTimeout(() => {
                        const el = arc.getElement() as SVGPathElement | undefined;
                        if (el) el.style.transition = "opacity 0.6s";
                        arc.setStyle({ opacity: 0 });
                        halo.setStyle({ opacity: 0 });
                        setTimeout(() => { arc.remove(); halo.remove(); }, 700);
                    }, 2800);
                    return;
                }
            }, 46);

            onNewEventRef.current?.(ev);
        };

        MOCK_EVENTS.forEach((ev, i) => {
            setTimeout(() => {
                if (activeTypesRef.current.has(ev.type) && activeSevRef.current.has(ev.severity))
                    fireAttack(ev);
            }, 300 + i * 120);
        });

        const interval = setInterval(() => {
            const base = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
            if (activeTypesRef.current.has(base.type) && activeSevRef.current.has(base.severity)) {
                fireAttack({
                    ...base,
                    id:     Date.now().toString(36),
                    time:   new Date().toTimeString().slice(0, 8),
                    tgtIdx: Math.floor(Math.random() * TARGETS.length),
                });
            }
        }, 1000);

        return () => { clearInterval(interval); map.remove(); mapRef.current = null; };
    }, []);

    return (
        <>
            <div ref={containerRef} className="db-map-canvas" />
            <div className="db-map-zoom">
                <button className="db-zoom-btn" onClick={() => mapRef.current?.zoomIn()}>+</button>
                <button className="db-zoom-btn" onClick={() => mapRef.current?.zoomOut()}>−</button>
                <button className="db-zoom-btn db-zoom-btn--reset" onClick={() => mapRef.current?.setView([20, 15], 2)} title="Reset view">⌂</button>
            </div>
        </>
    );
}
