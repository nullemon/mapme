'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaMap, FaTable } from 'react-icons/fa';
import DataTable from '@/components/DataTable';
import type { Game, DataTableDef } from '@/types';

export default function SingleTablePage({
  params,
}: {
  params: Promise<{ gameSlug: string; tableSlug: string }>;
}) {
  const { gameSlug, tableSlug } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [tables, setTables] = useState<DataTableDef[]>([]);
  const [table, setTable] = useState<DataTableDef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${gameSlug}`).then((r) => r.json()),
      fetch(`/api/games/${gameSlug}/tables`).then((r) => r.json()),
    ])
      .then(([gameData, tablesData]) => {
        setGame(gameData.error ? null : gameData);
        const parsed = (Array.isArray(tablesData) ? tablesData : []).map(
          (t: DataTableDef & { columns: string | unknown[]; data: string | unknown[] }) => ({
            ...t,
            columns:
              typeof t.columns === 'string' ? JSON.parse(t.columns) : t.columns,
            data: typeof t.data === 'string' ? JSON.parse(t.data) : t.data,
          }),
        );
        setTables(parsed);
        const found = parsed.find((t: DataTableDef) => t.slug === tableSlug) || null;
        setTable(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameSlug, tableSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!game || !table) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-lg">{!game ? 'Game' : 'Table'} not found</p>
        <Link
          href={!game ? '/' : `/${gameSlug}/tables`}
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href={`/${gameSlug}/tables`}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            <FaMap className="text-primary text-lg" />
            <span className="font-bold text-foreground">MapMe</span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{game.name}</span>
          <span className="text-border">/</span>
          <Link
            href={`/${gameSlug}/tables`}
            className="text-foreground font-medium hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <FaTable className="text-xs text-primary" />
            Tables
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{table.name}</span>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {table.name}
          </h1>
          {table.description && (
            <p className="text-muted">{table.description}</p>
          )}
        </div>

        <DataTable
          columns={Array.isArray(table.columns) ? table.columns : []}
          data={Array.isArray(table.data) ? table.data : []}
          searchable
          title={table.name}
          pageSize={25}
        />

        {/* Other tables navigation */}
        {tables.length > 1 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
              Other Tables
            </h3>
            <div className="flex flex-wrap gap-2">
              {tables
                .filter((t) => t.id !== table.id)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/${gameSlug}/tables/${t.slug}`}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-primary/50 transition-all"
                  >
                    {t.name}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
