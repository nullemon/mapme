'use client';

import { useState } from 'react';
import { FaGamepad, FaSearch } from 'react-icons/fa';
import type { Game } from '@/types';

/* ---------- props ---------- */

export interface GameSelectorProps {
  games: Game[];
}

/* ---------- component ---------- */

export default function GameSelector({ games }: GameSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <FaGamepad className="text-xl text-indigo-400" />
            <h1 className="text-xl font-bold">Game Maps</h1>
          </div>

          <div className="relative w-64">
            <FaSearch className="absolute left-3 top-2.5 text-sm text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full rounded-lg bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FaGamepad className="mx-auto mb-3 text-4xl text-gray-700" />
            <p className="text-gray-500">No games found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((game) => (
              <a
                key={game.id}
                href={`/games/${game.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-800 bg-gray-900 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-800">
                  {game.image_url ? (
                    <img
                      src={game.image_url}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FaGamepad className="text-4xl text-gray-700" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h2 className="mb-1 text-lg font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors">
                    {game.name}
                  </h2>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {game.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
