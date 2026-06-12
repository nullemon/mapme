'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { HexColorPicker } from 'react-colorful';
import {
  FaDrawPolygon,
  FaTrash,
  FaUndo,
  FaSave,
  FaTimes,
  FaPalette,
} from 'react-icons/fa';
import type { Category } from '@/types';

/* ---------- props ---------- */

export interface RouteDrawerProps {
  map: L.Map;
  categories: Category[];
  onSave: (data: {
    name: string;
    description: string;
    category_id: string;
    color: string;
    weight: number;
    points: number[][];
  }) => void;
  onCancel: () => void;
}

/* ---------- component ---------- */

export default function RouteDrawer({
  map,
  categories,
  onSave,
  onCancel,
}: RouteDrawerProps) {
  const [points, setPoints] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [color, setColor] = useState('#f97316');
  const [weight, setWeight] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Draw the polyline preview on the map
  const updatePreview = useCallback(
    (pts: number[][]) => {
      // Remove old polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }
      // Remove old point markers
      for (const m of markersRef.current) {
        map.removeLayer(m);
      }
      markersRef.current = [];

      if (pts.length < 1) return;

      // Draw polyline
      if (pts.length >= 2) {
        polylineRef.current = L.polyline(
          pts.map(([lat, lng]) => [lat, lng] as L.LatLngTuple),
          { color, weight, dashArray: '8 4' },
        ).addTo(map);
      }

      // Draw point markers
      for (const [lat, lng] of pts) {
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: '#fff',
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        markersRef.current.push(marker);
      }
    },
    [map, color, weight],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) map.removeLayer(polylineRef.current);
      for (const m of markersRef.current) map.removeLayer(m);
    };
  }, [map]);

  // Update preview when points or style changes
  useEffect(() => {
    updatePreview(points);
  }, [points, updatePreview]);

  // Handle map clicks while drawing
  useEffect(() => {
    if (!isDrawing) return;

    const handler = (e: L.LeafletMouseEvent) => {
      setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };

    map.on('click', handler);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
    };
  }, [isDrawing, map]);

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setPoints([]);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
    if (points.length >= 2) {
      setShowForm(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || points.length < 2) return;
    // Clean up preview
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    onSave({
      name: name.trim(),
      description: description.trim(),
      category_id: categoryId,
      color,
      weight,
      points,
    });
  };

  const handleCancel = () => {
    // Clean up preview
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];
    onCancel();
  };

  return (
    <>
      {/* Toolbar */}
      <div className="absolute top-2 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 rounded-lg bg-gray-900/90 px-3 py-2 shadow-lg backdrop-blur">
        {!showForm && (
          <>
            <button
              onClick={() => setIsDrawing(!isDrawing)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                isDrawing
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FaDrawPolygon />
              {isDrawing ? 'Drawing...' : 'Draw'}
            </button>

            <button
              onClick={handleUndo}
              disabled={points.length === 0}
              className="flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaUndo />
              Undo
            </button>

            <button
              onClick={handleClearAll}
              disabled={points.length === 0}
              className="flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FaTrash />
              Clear
            </button>

            {points.length >= 2 && (
              <button
                onClick={handleFinishDrawing}
                className="flex items-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 transition-colors"
              >
                <FaSave />
                Finish ({points.length} pts)
              </button>
            )}

            <div className="mx-1 h-5 w-px bg-gray-600" />

            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-600 hover:text-gray-200 transition-colors"
            >
              <FaTimes />
              Cancel
            </button>

            <span className="ml-2 text-[10px] text-gray-500">
              {points.length} point{points.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* Save form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-100">Save Route</h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsDrawing(true);
                }}
                className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 rounded bg-gray-900 px-3 py-2 text-xs text-gray-400 font-mono">
              {points.length} points recorded
            </div>

            {/* Name */}
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-300">
                Route Name <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Route name"
                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500 transition-colors"
              />
            </label>

            {/* Description */}
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-300">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description..."
                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500 transition-colors resize-none"
              />
            </label>

            {/* Category */}
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-300">
                Category
              </span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-100 outline-none ring-1 ring-gray-600 focus:ring-indigo-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Color + Weight */}
            <div className="mb-4 flex items-start gap-4">
              <div className="flex-1">
                <span className="mb-1 block text-sm font-medium text-gray-300">
                  Color
                </span>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center gap-2 rounded bg-gray-700 px-3 py-2 text-sm ring-1 ring-gray-600 hover:ring-indigo-500 transition-colors"
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-gray-500"
                    style={{ background: color }}
                  />
                  <span className="text-gray-300 font-mono text-xs">
                    {color}
                  </span>
                  <FaPalette className="text-gray-400 text-xs" />
                </button>
                {showColorPicker && (
                  <div className="mt-2">
                    <HexColorPicker color={color} onChange={setColor} />
                  </div>
                )}
              </div>

              <label className="w-24">
                <span className="mb-1 block text-sm font-medium text-gray-300">
                  Weight
                </span>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min={1}
                  max={12}
                  className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-100 outline-none ring-1 ring-gray-600 focus:ring-indigo-500 transition-colors"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                <FaSave className="text-xs" />
                Save Route
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
