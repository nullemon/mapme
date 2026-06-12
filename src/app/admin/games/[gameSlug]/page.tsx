'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaMap,
  FaTags,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaTimes,
} from 'react-icons/fa';
import type { Game, GameMap, Category } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function SingleGameAdminPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = use(params);

  const [game, setGame] = useState<Game | null>(null);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Game edit form
  const [gameName, setGameName] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [gameImageUrl, setGameImageUrl] = useState('');

  // Map modal
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapName, setMapName] = useState('');
  const [mapSlug, setMapSlug] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [savingMap, setSavingMap] = useState(false);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catParentId, setCatParentId] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gameRes, mapsRes, catsRes] = await Promise.all([
        fetch(`/api/games/${gameSlug}`),
        fetch(`/api/games/${gameSlug}/maps`),
        fetch(`/api/games/${gameSlug}/categories`),
      ]);

      const [gameData, mapsData, catsData] = await Promise.all([
        gameRes.json(),
        mapsRes.json(),
        catsRes.json(),
      ]);

      if (!gameData.error) {
        setGame(gameData);
        setGameName(gameData.name);
        setGameDescription(gameData.description || '');
        setGameImageUrl(gameData.image_url || '');
      }
      setMaps(Array.isArray(mapsData) ? mapsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/games/${gameSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName,
          description: gameDescription,
          image_url: gameImageUrl,
        }),
      });
      if (res.ok) {
        setMessage('Game updated successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to update game');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapName.trim() || !mapSlug.trim()) return;
    setSavingMap(true);
    try {
      const res = await fetch(`/api/games/${gameSlug}/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mapName,
          slug: mapSlug,
          description: mapDescription,
        }),
      });
      if (res.ok) {
        setShowMapModal(false);
        setMapName('');
        setMapSlug('');
        setMapDescription('');
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSavingMap(false);
    }
  };

  const handleDeleteMap = async (slug: string) => {
    if (!confirm('Delete this map and all its POIs/routes?')) return;
    try {
      await fetch(`/api/games/${gameSlug}/maps/${slug}`, { method: 'DELETE' });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch(`/api/games/${gameSlug}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          icon: catIcon || undefined,
          color: catColor,
          parent_id: catParentId || undefined,
        }),
      });
      if (res.ok) {
        setShowCatModal(false);
        setCatName('');
        setCatSlug('');
        setCatIcon('');
        setCatColor('#6366f1');
        setCatParentId('');
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/games/${gameSlug}/categories/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted mb-4">Game not found</p>
        <Link
          href="/admin/games"
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Back to games
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link
          href="/admin/games"
          className="text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <FaArrowLeft className="text-xs" />
          Games
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground font-medium">{game.name}</span>
        <Link
          href={`/${gameSlug}`}
          className="ml-2 text-muted hover:text-accent transition-colors"
          title="View on site"
        >
          <FaExternalLinkAlt className="text-xs" />
        </Link>
      </div>

      {/* Game Details Form */}
      <section className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Game Details
        </h2>

        {message && (
          <div className="mb-4 bg-success/10 border border-success/30 text-success text-sm rounded-lg p-3">
            {message}
          </div>
        )}

        <form onSubmit={handleSaveGame} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={gameImageUrl}
                onChange={(e) => setGameImageUrl(e.target.value)}
                className="w-full"
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={gameDescription}
              onChange={(e) => setGameDescription(e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FaSave className="text-xs" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Maps Section */}
      <section className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FaMap className="text-primary text-sm" />
            Maps
          </h2>
          <button
            onClick={() => setShowMapModal(true)}
            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            <FaPlus className="text-xs" />
            Add Map
          </button>
        </div>

        {maps.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">No maps yet.</p>
        ) : (
          <div className="space-y-2">
            {maps.map((map) => (
              <div
                key={map.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <FaMap className="text-xs text-primary" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/games/${gameSlug}/maps/${map.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {map.name}
                    </Link>
                    <p className="text-xs text-muted font-mono">{map.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/${gameSlug}/${map.slug}`}
                    className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="View on site"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                  </Link>
                  <Link
                    href={`/admin/games/${gameSlug}/maps/${map.slug}`}
                    className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FaEdit className="text-xs" />
                  </Link>
                  <button
                    onClick={() => handleDeleteMap(map.slug)}
                    className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FaTags className="text-accent text-sm" />
            Categories
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/games/${gameSlug}/categories`}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Manage
            </Link>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <FaPlus className="text-xs" />
              Add
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="text-muted text-sm py-4 text-center">
            No categories yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {categories
              .filter((c) => !c.parent_id)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((cat) => {
                const children = categories
                  .filter((c) => c.parent_id === cat.id)
                  .sort((a, b) => a.sort_order - b.sort_order);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-card-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                          style={{ background: cat.color || '#6366f1' }}
                        />
                        <span className="text-sm text-foreground">
                          {cat.icon && (
                            <span className="mr-1">{cat.icon}</span>
                          )}
                          {cat.name}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          {cat.slug}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                      >
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2.5 pl-10 rounded-lg hover:bg-card-hover transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-border"
                            style={{ background: child.color || '#6366f1' }}
                          />
                          <span className="text-sm text-muted">
                            {child.icon && (
                              <span className="mr-1">{child.icon}</span>
                            )}
                            {child.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(child.id)}
                          className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Add Map Modal */}
      {showMapModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add Map</h2>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddMap} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => {
                    setMapName(e.target.value);
                    setMapSlug(slugify(e.target.value));
                  }}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Slug <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={mapSlug}
                  onChange={(e) => setMapSlug(e.target.value)}
                  className="w-full font-mono text-sm"
                />
              </div>
              <div>
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMap}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {savingMap ? 'Creating...' : 'Create Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                Add Category
              </h2>
              <button
                onClick={() => setShowCatModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      setCatSlug(slugify(e.target.value));
                    }}
                    className="w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Slug <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="e.g. star"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-10 h-9 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Parent Category
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full"
                >
                  <option value="">None (top level)</option>
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-accent hover:bg-accent/80 text-background rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {savingCat ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
