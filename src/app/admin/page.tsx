'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaGamepad,
  FaMap,
  FaMapMarkerAlt,
  FaPlus,
  FaArrowRight,
  FaRobot,
  FaTrash,
  FaEdit,
} from 'react-icons/fa';
import type { Game } from '@/types';

interface Stats {
  totalGames: number;
  totalMaps: number;
  totalPois: number;
}

export default function AdminDashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalGames: 0,
    totalMaps: 0,
    totalPois: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      const gamesList = Array.isArray(data) ? data : [];
      setGames(gamesList);
      setStats((prev) => ({ ...prev, totalGames: gamesList.length }));

      // Count maps and POIs across all games
      let mapCount = 0;
      let poiCount = 0;
      for (const game of gamesList) {
        try {
          const mapsRes = await fetch(`/api/games/${game.slug}/maps`);
          const mapsData = await mapsRes.json();
          const maps = Array.isArray(mapsData) ? mapsData : [];
          mapCount += maps.length;

          for (const map of maps) {
            try {
              const poisRes = await fetch(
                `/api/games/${game.slug}/maps/${map.slug}/pois`,
              );
              const poisData = await poisRes.json();
              poiCount += Array.isArray(poisData) ? poisData.length : 0;
            } catch {
              // skip
            }
          }
        } catch {
          // skip
        }
      }

      setStats({ totalGames: gamesList.length, totalMaps: mapCount, totalPois: poiCount });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this game and all its data?')) return;
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted text-sm">
          Overview of your game maps and data.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          {
            label: 'Games',
            value: stats.totalGames,
            icon: FaGamepad,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Maps',
            value: stats.totalMaps,
            icon: FaMap,
            color: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'POIs',
            value: stats.totalPois,
            icon: FaMapMarkerAlt,
            color: 'text-success',
            bg: 'bg-success/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`${stat.color} text-sm`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-border rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          href="/admin/games"
          className="group flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
        >
          <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
            <FaPlus className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Manage Games
            </h3>
            <p className="text-sm text-muted">Add, edit, or remove games</p>
          </div>
          <FaArrowRight className="text-muted group-hover:text-primary transition-colors" />
        </Link>
        <Link
          href="/admin/import"
          className="group flex items-center gap-4 bg-card border border-border rounded-xl p-5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all"
        >
          <div className="bg-accent/10 p-3 rounded-lg group-hover:bg-accent/20 transition-colors">
            <FaRobot className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
              AI Import
            </h3>
            <p className="text-sm text-muted">
              Import POIs and data with AI
            </p>
          </div>
          <FaArrowRight className="text-muted group-hover:text-accent transition-colors" />
        </Link>
      </div>

      {/* Recent Games */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Games</h2>
        <Link
          href="/admin/games"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          View all
        </Link>
      </div>

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
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <FaGamepad className="text-3xl text-muted mx-auto mb-3" />
          <p className="text-muted mb-4">No games yet. Create your first game.</p>
          <Link
            href="/admin/games"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <FaPlus className="text-xs" />
            Add Game
          </Link>
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
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {games.slice(0, 5).map((game) => (
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
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <FaGamepad className="text-xs text-primary" />
                        </div>
                      )}
                      <span className="font-medium text-foreground text-sm">
                        {game.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted font-mono">
                    {game.slug}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {new Date(game.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/games/${game.slug}`}
                        className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-xs" />
                      </Link>
                      <button
                        onClick={() => handleDelete(game.slug)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
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
    </div>
  );
}
