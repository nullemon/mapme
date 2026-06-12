'use client';

import { useState, useMemo } from 'react';
import {
  FaSearch,
  FaChevronDown,
  FaChevronRight,
  FaMapMarkerAlt,
  FaRoute,
} from 'react-icons/fa';
import type { Category, POI, MapRoute } from '@/types';

/* ---------- props ---------- */

export interface MapSidebarProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onSearch: (query: string) => void;
  pois: POI[];
  routes: MapRoute[];
  onPoiSelect: (poi: POI) => void;
  onRouteSelect: (route: MapRoute) => void;
}

/* ---------- component ---------- */

export default function MapSidebar({
  categories,
  selectedCategories,
  onToggleCategory,
  onSearch,
  pois,
  routes,
  onPoiSelect,
  onRouteSelect,
}: MapSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build a tree structure: top-level categories + children
  const topLevel = useMemo(
    () => categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const childrenOf = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parent_id) {
        const list = map.get(c.parent_id) || [];
        list.push(c);
        map.set(c.parent_id, list);
      }
    }
    return map;
  }, [categories]);

  // Count POIs per category
  const poiCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const poi of pois) {
      counts.set(poi.category_id, (counts.get(poi.category_id) || 0) + 1);
    }
    return counts;
  }, [pois]);

  // Filter POIs by search
  const filteredPois = useMemo(() => {
    if (!search.trim()) return pois;
    const q = search.toLowerCase();
    return pois.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [pois, search]);

  // Group filtered POIs by category
  const poisByCategory = useMemo(() => {
    const map = new Map<string, POI[]>();
    for (const poi of filteredPois) {
      if (!selectedCategories.includes(poi.category_id)) continue;
      const list = map.get(poi.category_id) || [];
      list.push(poi);
      map.set(poi.category_id, list);
    }
    return map;
  }, [filteredPois, selectedCategories]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => selectedCategories.includes(r.category_id));
  }, [routes, selectedCategories]);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-gray-700 bg-gray-900 text-gray-200">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <FaSearch className="absolute left-2.5 top-2.5 text-gray-500 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search markers..."
            className="w-full rounded bg-gray-800 py-2 pl-8 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Category tree + POI list */}
      <div className="flex-1 overflow-y-auto">
        {/* Categories */}
        <div className="p-2">
          <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Categories
          </h3>
          {topLevel.map((cat) => {
            const children = childrenOf.get(cat.id) || [];
            const isExpanded = expandedCategories.has(cat.id);
            const count = poiCounts.get(cat.id) || 0;
            const checked = selectedCategories.includes(cat.id);

            return (
              <div key={cat.id} className="mb-0.5">
                {/* Category header */}
                <div className="flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-gray-800 transition-colors">
                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpanded(cat.id)}
                    className="text-gray-500 hover:text-gray-300 w-4 flex-shrink-0"
                  >
                    {children.length > 0 ? (
                      isExpanded ? (
                        <FaChevronDown className="text-[10px]" />
                      ) : (
                        <FaChevronRight className="text-[10px]" />
                      )
                    ) : (
                      <span className="block w-4" />
                    )}
                  </button>

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(cat.id)}
                    className="accent-indigo-500 flex-shrink-0"
                  />

                  {/* Icon dot */}
                  <span
                    className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: cat.color || '#6366f1' }}
                  />

                  {/* Name */}
                  <button
                    onClick={() => toggleExpanded(cat.id)}
                    className="flex-1 text-left text-sm truncate"
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </button>

                  {/* Count badge */}
                  {count > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                      {count}
                    </span>
                  )}
                </div>

                {/* Children */}
                {isExpanded && children.length > 0 && (
                  <div className="ml-5">
                    {children
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((child) => {
                        const childCount = poiCounts.get(child.id) || 0;
                        const childChecked = selectedCategories.includes(child.id);
                        return (
                          <div
                            key={child.id}
                            className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-800 transition-colors"
                          >
                            <span className="w-4 flex-shrink-0" />
                            <input
                              type="checkbox"
                              checked={childChecked}
                              onChange={() => onToggleCategory(child.id)}
                              className="accent-indigo-500 flex-shrink-0"
                            />
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ background: child.color || '#6366f1' }}
                            />
                            <span className="flex-1 text-sm truncate">
                              {child.icon && (
                                <span className="mr-1">{child.icon}</span>
                              )}
                              {child.name}
                            </span>
                            {childCount > 0 && (
                              <span className="flex-shrink-0 rounded-full bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                                {childCount}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* POIs under this category (accordion) */}
                {isExpanded && (poisByCategory.get(cat.id) || []).length > 0 && (
                  <div className="ml-5 mb-1">
                    {poisByCategory.get(cat.id)!.map((poi) => (
                      <button
                        key={poi.id}
                        onClick={() => onPoiSelect(poi)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                      >
                        <FaMapMarkerAlt
                          className="flex-shrink-0 text-[10px]"
                          style={{ color: poi.color || cat.color || '#6366f1' }}
                        />
                        <span className="truncate">{poi.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Routes section */}
        {filteredRoutes.length > 0 && (
          <div className="border-t border-gray-700 p-2">
            <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Routes
            </h3>
            {filteredRoutes.map((route) => {
              const cat = categories.find((c) => c.id === route.category_id);
              return (
                <button
                  key={route.id}
                  onClick={() => onRouteSelect(route)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-800 transition-colors"
                >
                  <FaRoute
                    className="flex-shrink-0 text-xs"
                    style={{ color: route.color || cat?.color || '#f97316' }}
                  />
                  <span className="truncate">{route.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
