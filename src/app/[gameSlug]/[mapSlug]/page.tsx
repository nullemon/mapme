'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  FaMap,
  FaArrowLeft,
  FaBars,
  FaEdit,
  FaTimes,
  FaRoute,
} from 'react-icons/fa';
import MapSidebar from '@/components/MapSidebar';
import MarkerForm from '@/components/MarkerForm';
import type { GameMap, POI, MapRoute, Category, Game } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const RouteDrawer = dynamic(() => import('@/components/RouteDrawer'), {
  ssr: false,
});

export default function MapPage({
  params,
}: {
  params: Promise<{ gameSlug: string; mapSlug: string }>;
}) {
  const { gameSlug, mapSlug } = use(params);

  const [game, setGame] = useState<Game | null>(null);
  const [mapData, setMapData] = useState<GameMap | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [markerFormPosition, setMarkerFormPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [drawingRoute, setDrawingRoute] = useState(false);

  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [gameRes, mapRes, poisRes, routesRes, catsRes] = await Promise.all([
        fetch(`/api/games/${gameSlug}`),
        fetch(`/api/games/${gameSlug}/maps/${mapSlug}`),
        fetch(`/api/games/${gameSlug}/maps/${mapSlug}/pois`),
        fetch(`/api/games/${gameSlug}/maps/${mapSlug}/routes`),
        fetch(`/api/games/${gameSlug}/categories`),
      ]);

      const [gameData, mapDataRes, poisData, routesData, catsData] =
        await Promise.all([
          gameRes.json(),
          mapRes.json(),
          poisRes.json(),
          routesRes.json(),
          catsRes.json(),
        ]);

      if (!gameData.error) setGame(gameData);
      if (!mapDataRes.error) setMapData(mapDataRes);

      const poisArr = Array.isArray(poisData) ? poisData : [];
      const routesArr = Array.isArray(routesData) ? routesData : [];
      const catsArr = Array.isArray(catsData) ? catsData : [];

      // Parse points JSON for routes
      const parsedRoutes = routesArr.map((r: MapRoute & { points: string | number[][] }) => ({
        ...r,
        points:
          typeof r.points === 'string' ? JSON.parse(r.points) : r.points,
      }));

      setPois(poisArr);
      setRoutes(parsedRoutes);
      setCategories(catsArr);
      setSelectedCategories(catsArr.map((c: Category) => c.id));
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  }, [gameSlug, mapSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Category toggle
  const handleToggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  // Search (filters POIs in sidebar, MapSidebar handles internally)
  const handleSearch = useCallback(() => {
    // MapSidebar handles filtering internally
  }, []);

  // POI selection - center map
  const handlePoiSelect = useCallback((poi: POI) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([poi.lat, poi.lng], undefined, {
        animate: true,
      });
    }
  }, []);

  // Route selection
  const handleRouteSelect = useCallback((route: MapRoute) => {
    if (mapInstanceRef.current && route.points.length > 0) {
      const bounds = route.points.reduce(
        (acc, [lat, lng]) => {
          return {
            minLat: Math.min(acc.minLat, lat),
            maxLat: Math.max(acc.maxLat, lat),
            minLng: Math.min(acc.minLng, lng),
            maxLng: Math.max(acc.maxLng, lng),
          };
        },
        {
          minLat: Infinity,
          maxLat: -Infinity,
          minLng: Infinity,
          maxLng: -Infinity,
        },
      );
      mapInstanceRef.current.fitBounds([
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ]);
    }
  }, []);

  // POI click from map
  const handlePoiClick = useCallback((poi: POI) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([poi.lat, poi.lng], undefined, {
        animate: true,
      });
    }
  }, []);

  // Edit mode - add POI on map click
  const handleAddPoi = useCallback(
    (lat: number, lng: number) => {
      if (editMode && !drawingRoute) {
        setMarkerFormPosition({ lat, lng });
      }
    },
    [editMode, drawingRoute],
  );

  // Save marker from form
  const handleMarkerSubmit = useCallback(
    async (data: {
      name: string;
      description: string;
      category_id: string;
      icon: string;
      color: string;
    }) => {
      if (!markerFormPosition) return;

      try {
        const res = await fetch(
          `/api/games/${gameSlug}/maps/${mapSlug}/pois`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              lat: markerFormPosition.lat,
              lng: markerFormPosition.lng,
            }),
          },
        );

        if (res.ok) {
          setMarkerFormPosition(null);
          fetchData();
        }
      } catch (err) {
        console.error('Failed to save POI:', err);
      }
    },
    [markerFormPosition, gameSlug, mapSlug, fetchData],
  );

  // Save route from drawer
  const handleRouteSave = useCallback(
    async (data: {
      name: string;
      description: string;
      category_id: string;
      color: string;
      weight: number;
      points: number[][];
    }) => {
      try {
        const res = await fetch(
          `/api/games/${gameSlug}/maps/${mapSlug}/routes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        );

        if (res.ok) {
          setDrawingRoute(false);
          fetchData();
        }
      } catch (err) {
        console.error('Failed to save route:', err);
      }
    },
    [gameSlug, mapSlug, fetchData],
  );

  // Capture map instance via ref callback through MapView
  const handleMapReady = useCallback((mapInstance: L.Map) => {
    mapInstanceRef.current = mapInstance;
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapData || !game) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-lg">Map not found</p>
        <Link
          href={`/${gameSlug}`}
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Back to game
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted hover:text-foreground transition-colors p-1"
            title="Toggle sidebar"
          >
            <FaBars />
          </button>
          <Link
            href={`/${gameSlug}`}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm"
          >
            <FaArrowLeft className="text-xs" />
            <FaMap className="text-primary" />
            <span className="font-medium text-foreground">{game.name}</span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground text-sm font-medium">
            {mapData.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Route drawing toggle */}
          <button
            onClick={() => {
              if (drawingRoute) {
                setDrawingRoute(false);
              } else {
                setEditMode(false);
                setDrawingRoute(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              drawingRoute
                ? 'bg-accent text-background'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-accent/50'
            }`}
            title="Draw route"
          >
            <FaRoute className="text-[10px]" />
            {drawingRoute ? 'Drawing...' : 'Route'}
          </button>

          {/* Edit mode toggle */}
          <button
            onClick={() => {
              if (editMode) {
                setEditMode(false);
              } else {
                setDrawingRoute(false);
                setEditMode(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              editMode
                ? 'bg-warning text-background'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-warning/50'
            }`}
            title="Toggle edit mode"
          >
            {editMode ? <FaTimes className="text-[10px]" /> : <FaEdit className="text-[10px]" />}
            {editMode ? 'Exit Edit' : 'Edit'}
          </button>
        </div>
      </header>

      {/* Main content: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <MapSidebar
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            onSearch={handleSearch}
            pois={pois}
            routes={routes}
            onPoiSelect={handlePoiSelect}
            onRouteSelect={handleRouteSelect}
          />
        )}

        {/* Map area */}
        <div className="flex-1 relative">
          <MapView
            mapData={mapData}
            pois={pois}
            routes={routes}
            categories={categories}
            selectedCategories={selectedCategories}
            editMode={editMode && !drawingRoute}
            onPoiClick={handlePoiClick}
            onAddPoi={handleAddPoi}
          />

          {/* Route Drawer overlay */}
          {drawingRoute && mapInstanceRef.current && (
            <RouteDrawer
              map={mapInstanceRef.current}
              categories={categories}
              onSave={handleRouteSave}
              onCancel={() => setDrawingRoute(false)}
            />
          )}
        </div>
      </div>

      {/* Marker Form Modal */}
      {markerFormPosition && (
        <MarkerForm
          position={markerFormPosition}
          categories={categories}
          onSubmit={handleMarkerSubmit}
          onCancel={() => setMarkerFormPosition(null)}
        />
      )}
    </div>
  );
}
