'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaMap,
  FaTable,
  FaArrowRight,
  FaDatabase,
} from 'react-icons/fa';
import DataTable from '@/components/DataTable';
import type { Game, DataTableDef } from '@/types';

export default function TablesPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [tables, setTables] = useState<DataTableDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

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
        <Link href="/" className="text-primary hover:text-primary-hover transition-colors">
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
              href={`/${gameSlug}`}
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <FaMap className="text-primary text-lg" />
              <span className="font-bold text-foreground">MapMe</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{game.name}</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium flex items-center gap-1.5">
              <FaTable className="text-xs text-primary" />
              Data Tables
            </span>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Tables</h1>
        <p className="text-muted mb-8">
          Game data organized in searchable, sortable tables.
        </p>

        {tables.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <FaDatabase className="text-4xl text-muted mx-auto mb-4" />
            <p className="text-muted">No data tables available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tables.map((table) => {
              const isExpanded = expandedTable === table.id;
              return (
                <div key={table.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Table header */}
                  <button
                    onClick={() => setExpandedTable(isExpanded ? null : table.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-card-hover transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FaTable className="text-primary text-sm" />
                      <div>
                        <h3 className="font-semibold text-foreground">{table.name}</h3>
                        {table.description && (
                          <p className="text-sm text-muted mt-0.5">{table.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted bg-background px-2 py-1 rounded">
                        {Array.isArray(table.data) ? table.data.length : 0} rows
                      </span>
                      <FaArrowRight
                        className={`text-xs text-muted transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded table view */}
                  {isExpanded && (
                    <div className="border-t border-border p-4">
                      <DataTable
                        columns={Array.isArray(table.columns) ? table.columns : []}
                        data={Array.isArray(table.data) ? table.data : []}
                        searchable
                        pageSize={15}
                      />
                      <div className="mt-3 text-right">
                        <Link
                          href={`/${gameSlug}/tables/${table.slug}`}
                          className="text-sm text-primary hover:text-primary-hover transition-colors"
                        >
                          Open full view
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
