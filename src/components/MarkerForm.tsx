'use client';

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { FaTimes, FaSave, FaPalette } from 'react-icons/fa';
import type { Category } from '@/types';

/* ---------- props ---------- */

export interface MarkerFormData {
  name: string;
  description: string;
  category_id: string;
  icon: string;
  color: string;
}

export interface MarkerFormProps {
  position: { lat: number; lng: number };
  categories: Category[];
  onSubmit: (data: MarkerFormData) => void;
  onCancel: () => void;
  initialData?: Partial<MarkerFormData>;
}

/* ---------- component ---------- */

export default function MarkerForm({
  position,
  categories,
  onSubmit,
  onCancel,
  initialData,
}: MarkerFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ?? (categories[0]?.id || ''),
  );
  const [icon, setIcon] = useState(initialData?.icon ?? '');
  const [color, setColor] = useState(initialData?.color ?? '#6366f1');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      category_id: categoryId,
      icon,
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-100">
            {initialData ? 'Edit Marker' : 'New Marker'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Coordinates display */}
        <div className="mb-4 rounded bg-gray-900 px-3 py-2 text-xs text-gray-400 font-mono">
          Position: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </div>

        {/* Name */}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-300">
            Name <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Marker name"
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
            rows={3}
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

        {/* Icon */}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-300">
            Custom Icon (emoji or text)
          </span>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g. ⭐ or 🏰"
            maxLength={4}
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-indigo-500 transition-colors"
          />
        </label>

        {/* Color */}
        <div className="mb-5">
          <span className="mb-1 block text-sm font-medium text-gray-300">
            Color
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 rounded bg-gray-700 px-3 py-2 text-sm ring-1 ring-gray-600 hover:ring-indigo-500 transition-colors"
            >
              <span
                className="inline-block h-4 w-4 rounded-full border border-gray-500"
                style={{ background: color }}
              />
              <span className="text-gray-300 font-mono text-xs">{color}</span>
              <FaPalette className="text-gray-400 text-xs" />
            </button>
          </div>
          {showColorPicker && (
            <div className="mt-2">
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            <FaSave className="text-xs" />
            {initialData ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
