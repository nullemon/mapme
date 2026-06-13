'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FaSave,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaRoute,
  FaExternalLinkAlt,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import type { Game, GameMap, POI, MapRoute, Category } from '@/types';

export default function MapEditorAdminPage({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'pois' | 'routes' | 'import'>('settings');

  // Map settings form
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [tileUrl, setTileUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(18);
  const [defaultZoom, setDefaultZoom] = useState(3);
  const [defaultLat, setDefaultLat] = useState(0);
  const [defaultLng, setDefaultLng] = useState(0);
  const [boundsSouth, setBoundsSouth] = useState(0);
  const [boundsWest, setBoundsWest] = useState(0);
  const [boundsNorth, setBoundsNorth] = useState(0);
  const [boundsEast, setBoundsEast] = useState(0);

  // POI modal
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [poiName, setPoiName] = useState('');
  const [poiDescription, setPoiDescription] = useState('');
  const [poiLat, setPoiLat] = useState(0);
  const [poiLng, setPoiLng] = useState(0);
  const [poiCategoryId, setPoiCategoryId] = useState('');
  const [poiIcon, setPoiIcon] = useState('');
  const [poiColor, setPoiColor] = useState('');
  const [savingPoi, setSavingPoi] = useState(false);

  // Route modal
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [routeCategoryId, setRouteCategoryId] = useState('');
  const [routeColor, setRouteColor] = useState('#f97316');
  const [routeWeight, setRouteWeight] = useState(3);
  const [routePointsText, setRoutePointsText] = useState('');
  const [savingRoute, setSavingRoute] = useState(false);

  // Bulk import
  const [bulkJson, setBulkJson] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

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
      if (!mapDataRes.error) {
        setMapData(mapDataRes);
        setMapName(mapDataRes.name);
        setMapDescription(mapDataRes.description || '');
        setTileUrl(mapDataRes.tile_url || '');
        setImageUrl(mapDataRes.image_url || '');
        setMinZoom(mapDataRes.min_zoom ?? 1);
        setMaxZoom(mapDataRes.max_zoom ?? 18);
        setDefaultZoom(mapDataRes.default_zoom ?? 3);
        setDefaultLat(mapDataRes.default_lat ?? 0);
        setDefaultLng(mapDataRes.default_lng ?? 0);
        setBoundsSouth(mapDataRes.bounds_south ?? 0);
        setBoundsWest(mapDataRes.bounds_west ?? 0);
        setBoundsNorth(mapDataRes.bounds_north ?? 0);
        setBoundsEast(mapDataRes.bounds_east ?? 0);
      }

      const poisArr = Array.isArray(poisData) ? poisData : [];
      const routesArr = Array.isArray(routesData) ? routesData : [];
      setPois(poisArr);
      setRoutes(
        routesArr.map((r: MapRoute & { points: string | number[][] }) => ({
          ...r,
          points:
            typeof r.points === 'string' ? JSON.parse(r.points) : r.points,
        })),
      );
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameSlug, mapSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/games/${gameSlug}/maps/${mapSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mapName,
          description: mapDescription,
          tile_url: tileUrl,
          image_url: imageUrl,
          min_zoom: minZoom,
          max_zoom: maxZoom,
          default_zoom: defaultZoom,
          default_lat: defaultLat,
          default_lng: defaultLng,
          bounds_south: boundsSouth,
          bounds_west: boundsWest,
          bounds_north: boundsNorth,
          bounds_east: boundsEast,
        }),
      });
      if (res.ok) {
        setMessage('Map settings saved');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poiName.trim()) return;
    setSavingPoi(true);
    try {
      const res = await fetch(`/api/games/${gameSlug}/maps/${mapSlug}/pois`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: poiName,
          description: poiDescription,
          lat: poiLat,
          lng: poiLng,
          category_id: poiCategoryId || undefined,
          icon: poiIcon || undefined,
          color: poiColor || undefined,
        }),
      });
      if (res.ok) {
        setShowPoiModal(false);
        setPoiName('');
        setPoiDescription('');
        setPoiLat(0);
        setPoiLng(0);
        setPoiCategoryId('');
        setPoiIcon('');
        setPoiColor('');
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSavingPoi(false);
    }
  };

  const handleDeletePoi = async (id: string) => {
    if (!confirm('Delete this POI?')) return;
    try {
      await fetch(`/api/games/${gameSlug}/maps/${mapSlug}/pois/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;
    setSavingRoute(true);
    try {
      let points: number[][] = [];
      if (routePointsText.trim()) {
        try {
          points = JSON.parse(routePointsText);
        } catch {
          setSavingRoute(false);
          return;
        }
      }
      const res = await fetch(
        `/api/games/${gameSlug}/maps/${mapSlug}/routes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: routeName,
            description: routeDescription,
            category_id: routeCategoryId || undefined,
            color: routeColor,
            weight: routeWeight,
            points,
          }),
        },
      );
      if (res.ok) {
        setShowRouteModal(false);
        setRouteName('');
        setRouteDescription('');
        setRouteCategoryId('');
        setRouteColor('#f97316');
        setRouteWeight(3);
        setRoutePointsText('');
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSavingRoute(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    try {
      await fetch(`/api/games/${gameSlug}/maps/${mapSlug}/routes/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) return;
    setBulkImporting(true);
    setBulkMessage('');
    try {
      const data = JSON.parse(bulkJson);
      let imported = 0;

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.lat != null && item.lng != null) {
            const res = await fetch(
              `/api/games/${gameSlug}/maps/${mapSlug}/pois`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              },
            );
            if (res.ok) imported++;
          } else if (item.points) {
            const res = await fetch(
              `/api/games/${gameSlug}/maps/${mapSlug}/routes`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              },
            );
            if (res.ok) imported++;
          }
        }
      }

      setBulkMessage(`Successfully imported ${imported} items`);
      setBulkJson('');
      fetchData();
    } catch (err) {
      setBulkMessage(
        `Import failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
      );
    } finally {
      setBulkImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!game || !mapData) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted mb-4">Map not found</p>
        <Link
          href={`/admin/games/${gameSlug}`}
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Back to game
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link
          href={`/admin/games/${gameSlug}`}
          className="text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <FaArrowLeft className="text-xs" />
          {game.name}
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground font-medium">{mapData.name}</span>
        <Link
          href={`/${gameSlug}/${mapSlug}`}
          className="ml-2 text-muted hover:text-accent transition-colors"
          title="View on site"
        >
          <FaExternalLinkAlt className="text-xs" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(['settings', 'pois', 'routes', 'import'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab === 'settings' && 'Settings'}
            {tab === 'pois' && `POIs (${pois.length})`}
            {tab === 'routes' && `Routes (${routes.length})`}
            {tab === 'import' && 'Bulk Import'}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-card border border-border rounded-xl p-6">
          {message && (
            <div className="mb-4 bg-success/10 border border-success/30 text-success text-sm rounded-lg p-3">
              {message}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Basic info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Basic Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Map Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                      placeholder="/maps/my-map.png or https://..."
                    />
                    <label className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-md text-sm cursor-pointer transition-colors shrink-0">
                      <FaUpload className="text-xs" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          setMessage('Uploading...');
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (res.ok) {
                              setImageUrl(data.url);
                              setMessage('Image uploaded!');
                            } else {
                              setMessage(data.error || 'Upload failed');
                            }
                          } catch {
                            setMessage('Upload failed');
                          }
                        }}
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 relative inline-block">
                      <img src={imageUrl} alt="Map preview" className="h-24 rounded border border-border object-cover" />
                      <button onClick={() => setImageUrl('')} className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted mt-1">
                    Upload a map image (PNG, JPG, WebP, SVG) or enter a URL. This displays as the map background.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={mapDescription}
                  onChange={(e) => setMapDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
            </div>

            {/* Tile configuration */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Tile Configuration
              </h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tile URL
                </label>
                <input
                  type="text"
                  value={tileUrl}
                  onChange={(e) => setTileUrl(e.target.value)}
                  className="w-full font-mono text-sm"
                  placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <p className="text-xs text-muted mt-1">
                  Leave empty for a plain background (non-geographic maps).
                </p>
              </div>
            </div>

            {/* Zoom levels */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Zoom Levels
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Min Zoom
                  </label>
                  <input
                    type="number"
                    value={minZoom}
                    onChange={(e) => setMinZoom(Number(e.target.value))}
                    className="w-full"
                    min={0}
                    max={22}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Max Zoom
                  </label>
                  <input
                    type="number"
                    value={maxZoom}
                    onChange={(e) => setMaxZoom(Number(e.target.value))}
                    className="w-full"
                    min={0}
                    max={22}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Default Zoom
                  </label>
                  <input
                    type="number"
                    value={defaultZoom}
                    onChange={(e) => setDefaultZoom(Number(e.target.value))}
                    className="w-full"
                    min={0}
                    max={22}
                  />
                </div>
              </div>
            </div>

            {/* Default position */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Default Position
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={defaultLat}
                    onChange={(e) => setDefaultLat(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={defaultLng}
                    onChange={(e) => setDefaultLng(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
              </div>
            </div>

            {/* Bounds */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                Map Bounds
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    South
                  </label>
                  <input
                    type="number"
                    value={boundsSouth}
                    onChange={(e) => setBoundsSouth(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    West
                  </label>
                  <input
                    type="number"
                    value={boundsWest}
                    onChange={(e) => setBoundsWest(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    North
                  </label>
                  <input
                    type="number"
                    value={boundsNorth}
                    onChange={(e) => setBoundsNorth(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    East
                  </label>
                  <input
                    type="number"
                    value={boundsEast}
                    onChange={(e) => setBoundsEast(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                <FaSave className="text-xs" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POIs Tab */}
      {activeTab === 'pois' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Points of Interest
            </h3>
            <button
              onClick={() => setShowPoiModal(true)}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <FaPlus className="text-xs" />
              Add POI
            </button>
          </div>

          {pois.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <FaMapMarkerAlt className="text-3xl text-muted mx-auto mb-3" />
              <p className="text-muted">No POIs yet.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-sidebar-bg/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Position
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pois.map((poi) => {
                    const cat = categories.find(
                      (c) => c.id === poi.category_id,
                    );
                    return (
                      <tr
                        key={poi.id}
                        className="border-b border-border/50 hover:bg-card-hover transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{
                                background:
                                  poi.color || cat?.color || '#6366f1',
                              }}
                            />
                            <span className="text-sm text-foreground">
                              {poi.icon && (
                                <span className="mr-1">{poi.icon}</span>
                              )}
                              {poi.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted">
                          {cat?.name || '---'}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted font-mono">
                          {poi.lat.toFixed(2)}, {poi.lng.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeletePoi(poi.id)}
                            className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Routes</h3>
            <button
              onClick={() => setShowRouteModal(true)}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <FaPlus className="text-xs" />
              Add Route
            </button>
          </div>

          {routes.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <FaRoute className="text-3xl text-muted mx-auto mb-3" />
              <p className="text-muted">No routes yet.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-sidebar-bg/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Points
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => {
                    const cat = categories.find(
                      (c) => c.id === route.category_id,
                    );
                    return (
                      <tr
                        key={route.id}
                        className="border-b border-border/50 hover:bg-card-hover transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-1 w-6 rounded"
                              style={{
                                background: route.color || '#f97316',
                              }}
                            />
                            <span className="text-sm text-foreground">
                              {route.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted">
                          {cat?.name || '---'}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted">
                          {Array.isArray(route.points)
                            ? route.points.length
                            : 0}{' '}
                          points
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bulk Import Tab */}
      {activeTab === 'import' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FaUpload className="text-primary text-sm" />
            Bulk Import
          </h3>
          <p className="text-sm text-muted mb-4">
            Paste a JSON array of POIs or routes. Each POI should have{' '}
            <code className="bg-background px-1 rounded text-xs">name</code>,{' '}
            <code className="bg-background px-1 rounded text-xs">lat</code>,{' '}
            <code className="bg-background px-1 rounded text-xs">lng</code>.
            Routes should have{' '}
            <code className="bg-background px-1 rounded text-xs">name</code> and{' '}
            <code className="bg-background px-1 rounded text-xs">points</code>.
          </p>

          {bulkMessage && (
            <div
              className={`mb-4 text-sm rounded-lg p-3 ${
                bulkMessage.startsWith('Successfully')
                  ? 'bg-success/10 border border-success/30 text-success'
                  : 'bg-danger/10 border border-danger/30 text-danger'
              }`}
            >
              {bulkMessage}
            </div>
          )}

          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={12}
            placeholder={`[\n  {\n    "name": "Location Name",\n    "lat": 50.0,\n    "lng": 30.0,\n    "category_id": "...",\n    "description": "..."\n  }\n]`}
            className="w-full font-mono text-sm resize-none"
          />

          <div className="flex justify-end mt-4">
            <button
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkJson.trim()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FaUpload className="text-xs" />
              {bulkImporting ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      )}

      {/* Add POI Modal */}
      {showPoiModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add POI</h2>
              <button
                onClick={() => setShowPoiModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddPoi} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={poiName}
                  onChange={(e) => setPoiName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={poiDescription}
                  onChange={(e) => setPoiDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={poiLat}
                    onChange={(e) => setPoiLat(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={poiLng}
                    onChange={(e) => setPoiLng(Number(e.target.value))}
                    className="w-full"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={poiCategoryId}
                  onChange={(e) => setPoiCategoryId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={poiIcon}
                    onChange={(e) => setPoiIcon(e.target.value)}
                    className="w-full"
                    placeholder="emoji"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    value={poiColor}
                    onChange={(e) => setPoiColor(e.target.value)}
                    className="w-full"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoiModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPoi}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {savingPoi ? 'Saving...' : 'Create POI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showRouteModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add Route</h2>
              <button
                onClick={() => setShowRouteModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddRoute} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={routeCategoryId}
                  onChange={(e) => setRouteCategoryId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    value={routeColor}
                    onChange={(e) => setRouteColor(e.target.value)}
                    className="w-full font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={routeWeight}
                    onChange={(e) => setRouteWeight(Number(e.target.value))}
                    className="w-full"
                    min={1}
                    max={12}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Points (JSON array)
                </label>
                <textarea
                  value={routePointsText}
                  onChange={(e) => setRoutePointsText(e.target.value)}
                  rows={4}
                  placeholder="[[lat, lng], [lat, lng], ...]"
                  className="w-full font-mono text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoute}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {savingRoute ? 'Saving...' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
