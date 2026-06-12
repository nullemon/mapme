'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaMap,
  FaArrowLeft,
  FaArrowRight,
  FaTable,
  FaGamepad,
} from 'react-icons/fa';
import type { Game, GameMap } from '@/types';

export default function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameSlug}`).then((r) => r.json()),
      fetch(`/api/games/${gameSlug}/maps`).then((r) => r.json()),
    ])
      .then(([gameData, mapsData]) => {
        setGame(gameData.error ? null : gameData);
        setMaps(Array.isArray(mapsData) ? mapsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-lg">Game not found</p>
        <Link
          href="/"
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <FaMap className="text-primary text-lg" />
              <span className="font-bold text-foreground">MapMe</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{game.name}</span>
          </div>
          <Link
            href={`/${gameSlug}/tables`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <FaTable className="text-xs" />
            Data Tables
          </Link>
        </div>
      </nav>

      {/* Game Header */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-start gap-6 mb-8">
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.name}
              className="w-24 h-24 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-card border border-border flex items-center justify-center">
              <FaGamepad className="text-3xl text-primary/40" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {game.name}
            </h1>
            {game.description && (
              <p className="text-muted max-w-2xl">{game.description}</p>
            )}
          </div>
        </div>

        {/* Maps Grid */}
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Available Maps
        </h2>

        {maps.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <FaMap className="text-4xl text-muted mx-auto mb-4" />
            <p className="text-muted">No maps available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map) => (
              <Link
                key={map.id}
                href={`/${gameSlug}/${map.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="relative h-44 bg-gradient-to-br from-primary/10 to-accent/5 overflow-hidden">
                  {map.image_url ? (
                    <img
                      src={map.image_url}
                      alt={map.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaMap className="text-4xl text-primary/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {map.name}
                  </h3>
                  {map.description && (
                    <p className="text-sm text-muted line-clamp-2">
                      {map.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open map</span>
                    <FaArrowRight className="text-[10px]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
