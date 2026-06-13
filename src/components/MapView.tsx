'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { GameMap, POI, MapRoute, Category } from '@/types';

/* ---------- props ---------- */

export interface MapViewProps {
  mapData: GameMap;
  pois: POI[];
  routes: MapRoute[];
  categories: Category[];
  selectedCategories: string[];
  editMode: boolean;
  onPoiClick?: (poi: POI) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onAddPoi?: (lat: number, lng: number) => void;
}

/* ---------- helpers ---------- */

function categoryFor(id: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.id === id);
}

function makeDivIcon(color: string, icon: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    html: `<div style="
      width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      background:${color || '#6366f1'};border:2px solid #fff;border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;font-size:14px;
    ">${icon ? `<span>${icon}</span>` : ''}</div>`,
  });
}

/* ---------- sub-components ---------- */

/** Syncs the URL hash with map position: #zoom/lat/lng */
function HashSync() {
  const map = useMap();

  // On mount, read hash and fly there
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const parts = hash.split('/');
    if (parts.length === 3) {
      const zoom = Number(parts[0]);
      const lat = Number(parts[1]);
      const lng = Number(parts[2]);
      if (!isNaN(zoom) && !isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], zoom);
      }
    }
  }, [map]);

  // Update hash on move
  useMapEvents({
    moveend() {
      const c = map.getCenter();
      const z = map.getZoom();
      window.history.replaceState(
        null,
        '',
        `#${z}/${c.lat.toFixed(4)}/${c.lng.toFixed(4)}`,
      );
    },
  });

  return null;
}

/** Shows cursor coordinates at the bottom of the map */
function CoordinateOverlay() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    mousemove(e) {
      setPos({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!pos) return null;

  return (
    <div className="absolute bottom-2 left-2 z-[1000] rounded bg-gray-900/80 px-2 py-1 text-xs text-gray-300 font-mono select-none pointer-events-none">
      {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
    </div>
  );
}

/** Handles click events for placing POIs in edit mode */
function ClickHandler({
  editMode,
  onMapClick,
  onAddPoi,
}: {
  editMode: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onAddPoi?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (editMode && onAddPoi) {
        onAddPoi(lat, lng);
      }
      onMapClick?.(lat, lng);
    },
  });

  return null;
}

/* ---------- main component ---------- */

export default function MapView({
  mapData,
  pois,
  routes,
  categories,
  selectedCategories,
  editMode,
  onPoiClick,
  onMapClick,
  onAddPoi,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isNonGeographic = !mapData.tile_url;

  const crs = isNonGeographic ? L.CRS.Simple : L.CRS.EPSG3857;

  const bounds: L.LatLngBoundsExpression | undefined =
    mapData.bounds_south != null &&
    mapData.bounds_west != null &&
    mapData.bounds_north != null &&
    mapData.bounds_east != null
      ? [
          [mapData.bounds_south, mapData.bounds_west],
          [mapData.bounds_north, mapData.bounds_east],
        ]
      : undefined;

  const center: L.LatLngExpression = [
    mapData.default_lat ?? 0,
    mapData.default_lng ?? 0,
  ];

  const visiblePois = pois.filter((p) =>
    selectedCategories.includes(p.category_id),
  );

  const visibleRoutes = routes.filter((r) =>
    selectedCategories.includes(r.category_id),
  );

  const handlePoiClick = useCallback(
    (poi: POI) => {
      onPoiClick?.(poi);
    },
    [onPoiClick],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={mapData.default_zoom ?? 3}
        minZoom={mapData.min_zoom ?? 1}
        maxZoom={mapData.max_zoom ?? 18}
        crs={crs}
        maxBounds={bounds}
        className="h-full w-full"
        style={{ background: '#1a1a2e' }}
      >
        {/* Map background: tiles, image overlay, or plain */}
        {mapData.tile_url ? (
          <TileLayer
            url={mapData.tile_url}
            maxZoom={mapData.max_zoom ?? 18}
            minZoom={mapData.min_zoom ?? 1}
            bounds={bounds}
          />
        ) : mapData.image_url && bounds ? (
          <ImageOverlay
            url={mapData.image_url}
            bounds={bounds}
          />
        ) : null}

        {/* POI markers */}
        {visiblePois.map((poi) => {
          const cat = categoryFor(poi.category_id, categories);
          const color = poi.color || cat?.color || '#6366f1';
          const icon = poi.icon || cat?.icon || '';
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={makeDivIcon(color, icon)}
              eventHandlers={{
                click: () => handlePoiClick(poi),
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <h3 className="font-bold text-sm mb-1">{poi.name}</h3>
                  {poi.description && (
                    <p className="text-xs text-gray-600">{poi.description}</p>
                  )}
                  {cat && (
                    <span
                      className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: cat.color, color: '#fff' }}
                    >
                      {cat.name}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Routes */}
        {visibleRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points.map(([lat, lng]) => [lat, lng] as L.LatLngTuple)}
            pathOptions={{
              color: route.color || '#f97316',
              weight: route.weight || 3,
            }}
          >
            <Popup>
              <div>
                <h3 className="font-bold text-sm">{route.name}</h3>
                {route.description && (
                  <p className="text-xs text-gray-600">{route.description}</p>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Internal sub-components */}
        <HashSync />
        <CoordinateOverlay />
        <ClickHandler
          editMode={editMode}
          onMapClick={onMapClick}
          onAddPoi={onAddPoi}
        />
      </MapContainer>

      {/* Edit-mode indicator */}
      {editMode && (
        <div className="absolute top-2 right-2 z-[1000] rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow">
          Edit Mode — Click to place marker
        </div>
      )}
    </div>
  );
}
