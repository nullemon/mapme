'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaMap, FaGamepad, FaArrowRight } from 'react-icons/fa';
import type { Game } from '@/types';

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        setGames(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FaMap className="text-primary text-xl" />
            <span className="text-xl font-bold text-foreground">MapMe</span>
          </Link>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <FaGamepad className="text-primary text-sm" />
            <span className="text-sm text-primary">Interactive Game Maps</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
            MapMe
          </h1>
          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-8">
            Interactive Game Maps for Every World
          </p>
          <p className="text-muted max-w-xl mx-auto">
            Explore detailed maps with custom markers, routes, and data tables.
            Track collectibles, plan routes, and never miss a hidden secret
            again.
          </p>
        </div>
      </section>

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          Select a Game
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <FaGamepad className="text-5xl text-muted mx-auto mb-4" />
            <p className="text-muted text-lg mb-2">No games yet</p>
            <p className="text-muted/70 text-sm mb-6">
              Head to the admin panel to add your first game.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
            >
              Go to Admin
              <FaArrowRight className="text-sm" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/${game.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Game image or placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
                  {game.image_url ? (
                    <img
                      src={game.image_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaGamepad className="text-4xl text-primary/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
                {/* Game info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {game.name}
                  </h3>
                  {game.description && (
                    <p className="text-sm text-muted line-clamp-2">
                      {game.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore maps</span>
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
