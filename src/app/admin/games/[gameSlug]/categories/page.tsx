'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaTags,
  FaChevronDown,
  FaChevronRight,
  FaGripVertical,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import type { Game, Category } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CategoryManagementPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = use(params);

  const [game, setGame] = useState<Game | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catParentId, setCatParentId] = useState('');
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gameRes, catsRes] = await Promise.all([
        fetch(`/api/games/${gameSlug}`),
        fetch(`/api/games/${gameSlug}/categories`),
      ]);
      const [gameData, catsData] = await Promise.all([
        gameRes.json(),
        catsRes.json(),
      ]);
      if (!gameData.error) setGame(gameData);
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

  const topLevel = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const childrenOf = (parentId: string) =>
    categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddModal = (parentId?: string) => {
    setEditingCat(null);
    setCatName('');
    setCatSlug('');
    setCatIcon('');
    setCatColor('#6366f1');
    setCatParentId(parentId || '');
    setCatSortOrder(0);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatIcon(cat.icon || '');
    setCatColor(cat.color || '#6366f1');
    setCatParentId(cat.parent_id || '');
    setCatSortOrder(cat.sort_order);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    setSaving(true);

    try {
      if (editingCat) {
        await fetch(`/api/games/${gameSlug}/categories/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName,
            slug: catSlug,
            icon: catIcon || null,
            color: catColor,
            parent_id: catParentId || null,
            sort_order: catSortOrder,
          }),
        });
      } else {
        await fetch(`/api/games/${gameSlug}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName,
            slug: catSlug,
            icon: catIcon || undefined,
            color: catColor,
            parent_id: catParentId || undefined,
            sort_order: catSortOrder,
          }),
        });
      }
      setShowModal(false);
      fetchData();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleReorder = async (cat: Category, direction: 'up' | 'down') => {
    const siblings = cat.parent_id
      ? childrenOf(cat.parent_id)
      : topLevel;
    const idx = siblings.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const other = siblings[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/games/${gameSlug}/categories/${cat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: other.sort_order }),
        }),
        fetch(`/api/games/${gameSlug}/categories/${other.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: cat.sort_order }),
        }),
      ]);
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

  const renderCategory = (cat: Category, depth: number = 0) => {
    const children = childrenOf(cat.id);
    const isExpanded = expandedIds.has(cat.id);
    const siblings = cat.parent_id ? childrenOf(cat.parent_id) : topLevel;
    const idx = siblings.findIndex((c) => c.id === cat.id);

    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-card-hover transition-colors group"
          style={{ paddingLeft: `${depth * 28 + 12}px` }}
        >
          {/* Expand toggle */}
          <button
            onClick={() => toggleExpand(cat.id)}
            className="text-muted hover:text-foreground w-5 flex-shrink-0"
          >
            {children.length > 0 ? (
              isExpanded ? (
                <FaChevronDown className="text-[10px]" />
              ) : (
                <FaChevronRight className="text-[10px]" />
              )
            ) : (
              <FaGripVertical className="text-[10px] text-muted/30" />
            )}
          </button>

          {/* Color dot */}
          <span
            className="inline-block h-4 w-4 rounded-full border border-border flex-shrink-0"
            style={{ background: cat.color || '#6366f1' }}
          />

          {/* Name & icon */}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground font-medium">
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </span>
            <span className="ml-2 text-xs text-muted font-mono">
              {cat.slug}
            </span>
          </div>

          {/* Sort order badge */}
          <span className="text-[10px] text-muted bg-background px-1.5 py-0.5 rounded">
            #{cat.sort_order}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleReorder(cat, 'up')}
              disabled={idx === 0}
              className="p-1 text-muted hover:text-foreground rounded disabled:opacity-30 transition-colors"
              title="Move up"
            >
              <FaArrowUp className="text-[10px]" />
            </button>
            <button
              onClick={() => handleReorder(cat, 'down')}
              disabled={idx === siblings.length - 1}
              className="p-1 text-muted hover:text-foreground rounded disabled:opacity-30 transition-colors"
              title="Move down"
            >
              <FaArrowDown className="text-[10px]" />
            </button>
            {!cat.parent_id && (
              <button
                onClick={() => openAddModal(cat.id)}
                className="p-1 text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors"
                title="Add sub-category"
              >
                <FaPlus className="text-[10px]" />
              </button>
            )}
            <button
              onClick={() => openEditModal(cat)}
              className="p-1 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Edit"
            >
              <FaEdit className="text-[10px]" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
              title="Delete"
            >
              <FaTrash className="text-[10px]" />
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded &&
          children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
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
        <span className="text-foreground font-medium flex items-center gap-1.5">
          <FaTags className="text-accent text-xs" />
          Categories
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Categories
          </h1>
          <p className="text-muted text-sm">
            Organize POIs and routes into categories.
          </p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
        >
          <FaPlus className="text-xs" />
          Add Category
        </button>
      </div>

      {/* Category Tree */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FaTags className="text-4xl text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">No categories yet.</p>
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <FaPlus className="text-xs" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-2">
          {topLevel.map((cat) => renderCategory(cat))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {editingCat ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                      if (!editingCat)
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

              <div className="grid grid-cols-3 gap-4">
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
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(Number(e.target.value))}
                    className="w-full"
                  />
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
                    .filter(
                      (c) =>
                        !c.parent_id &&
                        c.id !== editingCat?.id,
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Preview */}
              <div className="bg-background rounded-lg p-3 flex items-center gap-3">
                <span
                  className="inline-block h-5 w-5 rounded-full border border-border"
                  style={{ background: catColor }}
                />
                <span className="text-sm text-foreground">
                  {catIcon && <span className="mr-1">{catIcon}</span>}
                  {catName || 'Preview'}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground rounded-lg border border-border hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  <FaSave className="text-xs" />
                  {saving
                    ? 'Saving...'
                    : editingCat
                      ? 'Update'
                      : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
