'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaGamepad,
  FaTimes,
  FaSave,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import type { Game } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface GameFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

const emptyForm: GameFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState<GameFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openAddModal = () => {
    setEditingGame(null);
    setFormData(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormData({
      name: game.name,
      slug: game.slug,
      description: game.description || '',
      image_url: game.image_url || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingGame ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = editingGame
        ? `/api/games/${editingGame.slug}`
        : '/api/games';
      const method = editingGame ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save game');
      }

      setShowModal(false);
      fetchGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this game? This will remove all maps, POIs, and routes.')) return;
    try {
      await fetch(`/api/games/${slug}`, { method: 'DELETE' });
      fetchGames();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Games</h1>
          <p className="text-muted text-sm">
            Manage your game projects.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
        >
          <FaPlus className="text-xs" />
          Add Game
        </button>
      </div>

      {/* Games Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl h-16 animate-pulse"
            />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FaGamepad className="text-4xl text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">No games yet</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <FaPlus className="text-xs" />
            Create First Game
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-sidebar-bg/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Game
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr
                  key={game.id}
                  className="border-b border-border/50 hover:bg-card-hover transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {game.image_url ? (
                        <img
                          src={game.image_url}
                          alt={game.name}
                          className="w-9 h-9 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                          <FaGamepad className="text-xs text-primary" />
                        </div>
                      )}
                      <Link
                        href={`/admin/games/${game.slug}`}
                        className="font-medium text-foreground text-sm hover:text-primary transition-colors"
                      >
                        {game.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted font-mono">
                    {game.slug}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted hidden md:table-cell max-w-xs truncate">
                    {game.description || '---'}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {new Date(game.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/${game.slug}`}
                        className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="View on site"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                      </Link>
                      <Link
                        href={`/admin/games/${game.slug}`}
                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-xs" />
                      </Link>
                      <button
                        onClick={() => openEditModal(game)}
                        className="p-2 text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                        title="Quick Edit"
                      >
                        <FaGamepad className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(game.slug)}
                        className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editingGame ? 'Edit Game' : 'Add New Game'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. World of Warcraft"
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
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="world-of-warcraft"
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-muted mt-1">
                  Used in URLs. Auto-generated from name.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the game..."
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-lg border border-border hover:bg-card-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {saving ? 'Saving...' : editingGame ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
