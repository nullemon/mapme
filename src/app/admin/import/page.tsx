'use client';

import { useEffect, useState } from 'react';
import {
  FaRobot,
  FaPlay,
  FaCheck,
  FaSpinner,
  FaExclamationTriangle,
  FaDownload,
  FaGamepad,
} from 'react-icons/fa';
import type { Game } from '@/types';

interface ImportResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
}

export default function AIImportPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState('');
  const [selectedMapSlug, setSelectedMapSlug] = useState('');
  const [maps, setMaps] = useState<{ slug: string; name: string }[]>([]);
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini'>(
    'claude',
  );
  const [importType, setImportType] = useState<'pois' | 'routes' | 'table'>(
    'pois',
  );
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'preview' | 'importing' | 'done' | 'error'
  >('idle');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then((data) => {
        const g = Array.isArray(data) ? data : [];
        setGames(g);
        if (g.length > 0) setSelectedGameSlug(g[0].slug);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedGameSlug) {
      setMaps([]);
      return;
    }
    fetch(`/api/games/${selectedGameSlug}/maps`)
      .then((r) => r.json())
      .then((data) => {
        const m = Array.isArray(data) ? data : [];
        setMaps(m);
        if (m.length > 0) setSelectedMapSlug(m[0].slug);
        else setSelectedMapSlug('');
      })
      .catch(() => {});
  }, [selectedGameSlug]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedGameSlug) return;

    setStatus('generating');
    setErrorMessage('');
    setResults([]);

    // Simulate AI generation since we don't have actual AI API endpoints yet.
    // In production, this would call /api/import with the provider and prompt.
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock results based on import type
      const mockResults: ImportResult[] = [];

      if (importType === 'pois') {
        // Generate sample POIs based on the prompt
        const sampleNames = [
          'Northern Entrance',
          'Hidden Cave',
          'Ancient Ruins',
          'Merchant Camp',
          'Resource Node',
          'Boss Arena',
          'Treasure Chest',
          'Fast Travel Point',
        ];
        const count = Math.min(3 + Math.floor(Math.random() * 5), 8);
        for (let i = 0; i < count; i++) {
          mockResults.push({
            type: 'poi',
            name: sampleNames[i] || `Location ${i + 1}`,
            data: {
              name: sampleNames[i] || `Location ${i + 1}`,
              description: `Generated from prompt: "${prompt.slice(0, 50)}..."`,
              lat: Math.random() * 180 - 90,
              lng: Math.random() * 360 - 180,
            },
          });
        }
      } else if (importType === 'routes') {
        mockResults.push({
          type: 'route',
          name: 'Generated Route',
          data: {
            name: 'Generated Route',
            description: `Route generated from: "${prompt.slice(0, 50)}..."`,
            color: '#f97316',
            weight: 3,
            points: Array.from({ length: 5 }, () => [
              Math.random() * 180 - 90,
              Math.random() * 360 - 180,
            ]),
          },
        });
      } else {
        mockResults.push({
          type: 'table',
          name: 'Generated Table',
          data: {
            name: 'Generated Data',
            slug: 'generated-data',
            description: `Table from: "${prompt.slice(0, 50)}..."`,
            columns: [
              { key: 'name', label: 'Name', sortable: true },
              { key: 'value', label: 'Value', sortable: true },
              { key: 'notes', label: 'Notes', sortable: false },
            ],
            data: [
              { name: 'Item 1', value: '100', notes: 'Sample data' },
              { name: 'Item 2', value: '200', notes: 'Sample data' },
              { name: 'Item 3', value: '300', notes: 'Sample data' },
            ],
          },
        });
      }

      setResults(mockResults);
      setStatus('preview');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Generation failed',
      );
      setStatus('error');
    }
  };

  const handleImport = async () => {
    if (results.length === 0 || !selectedGameSlug) return;

    setStatus('importing');
    setImportProgress(0);

    try {
      let imported = 0;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.type === 'poi' && selectedMapSlug) {
          await fetch(
            `/api/games/${selectedGameSlug}/maps/${selectedMapSlug}/pois`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(result.data),
            },
          );
          imported++;
        } else if (result.type === 'route' && selectedMapSlug) {
          await fetch(
            `/api/games/${selectedGameSlug}/maps/${selectedMapSlug}/routes`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(result.data),
            },
          );
          imported++;
        } else if (result.type === 'table') {
          await fetch(`/api/games/${selectedGameSlug}/tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
          });
          imported++;
        }

        setImportProgress(Math.round(((i + 1) / results.length) * 100));
      }

      setStatus('done');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Import failed',
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResults([]);
    setErrorMessage('');
    setImportProgress(0);
    setPrompt('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-3">
          <FaRobot className="text-accent" />
          AI Import
        </h1>
        <p className="text-muted text-sm">
          Use AI to generate and import game data from text prompts.
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              AI Provider
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'claude', label: 'Claude', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
                  { value: 'openai', label: 'OpenAI', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
                  { value: 'gemini', label: 'Gemini', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                ] as const
              ).map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    provider === p.value
                      ? p.color
                      : 'bg-background border-border text-muted hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Import Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Import Type
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'pois', label: 'POIs' },
                  { value: 'routes', label: 'Routes' },
                  { value: 'table', label: 'Table' },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setImportType(t.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    importType === t.value
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-background border-border text-muted hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Game */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Target Game
            </label>
            {games.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted p-2 bg-background rounded-lg border border-border">
                <FaGamepad className="text-xs" />
                No games available. Create a game first.
              </div>
            ) : (
              <select
                value={selectedGameSlug}
                onChange={(e) => setSelectedGameSlug(e.target.value)}
                className="w-full"
              >
                {games.map((g) => (
                  <option key={g.id} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Target Map (for POIs and Routes) */}
          {importType !== 'table' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target Map
              </label>
              {maps.length === 0 ? (
                <div className="text-sm text-muted p-2 bg-background rounded-lg border border-border">
                  No maps available for this game.
                </div>
              ) : (
                <select
                  value={selectedMapSlug}
                  onChange={(e) => setSelectedMapSlug(e.target.value)}
                  className="w-full"
                >
                  {maps.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Prompt
        </h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder={
            importType === 'pois'
              ? 'e.g. "Import all herb locations for Elwynn Forest in World of Warcraft"'
              : importType === 'routes'
                ? 'e.g. "Create a route through all the main quest locations in Stormwind"'
                : 'e.g. "Create a table of all crafting materials with their drop locations and rates"'
          }
          className="w-full resize-none"
          disabled={status === 'generating' || status === 'importing'}
        />

        <div className="flex justify-end mt-4">
          {status === 'idle' || status === 'error' ? (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || !selectedGameSlug}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FaPlay className="text-xs" />
              Generate Preview
            </button>
          ) : status === 'done' ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
            >
              Start New Import
            </button>
          ) : null}
        </div>
      </div>

      {/* Status / Progress */}
      {status === 'generating' && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FaSpinner className="text-3xl text-primary mx-auto mb-4 animate-spin" />
          <p className="text-foreground font-medium">
            Generating with {provider === 'claude' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Gemini'}...
          </p>
          <p className="text-sm text-muted mt-1">
            This may take a moment.
          </p>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 flex items-start gap-3">
          <FaExclamationTriangle className="text-danger mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-danger font-medium">Error</p>
            <p className="text-sm text-danger/80 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {status === 'preview' && results.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Preview ({results.length} items)
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 bg-success hover:bg-success/80 text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <FaDownload className="text-xs" />
                Import All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
              >
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    result.type === 'poi'
                      ? 'bg-primary/10 text-primary'
                      : result.type === 'route'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-accent/10 text-accent'
                  }`}
                >
                  {result.type.toUpperCase()}
                </span>
                <span className="text-sm text-foreground flex-1">
                  {result.name}
                </span>
                {result.data.lat != null && (
                  <span className="text-xs text-muted font-mono">
                    {Number(result.data.lat).toFixed(2)},{' '}
                    {Number(result.data.lng).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Progress */}
      {status === 'importing' && (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center mb-4">
            <FaSpinner className="text-3xl text-primary mx-auto mb-4 animate-spin" />
            <p className="text-foreground font-medium">Importing...</p>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted mt-2">
            {importProgress}%
          </p>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-8 text-center">
          <FaCheck className="text-3xl text-success mx-auto mb-4" />
          <p className="text-foreground font-medium">Import Complete</p>
          <p className="text-sm text-muted mt-1">
            {results.length} item{results.length !== 1 ? 's' : ''} imported
            successfully.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-card/50 border border-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          How it works
        </h3>
        <ol className="text-sm text-muted space-y-1.5 list-decimal list-inside">
          <li>Select your AI provider and import type</li>
          <li>Choose the target game and map</li>
          <li>Write a detailed prompt describing the data you want</li>
          <li>Preview the generated results</li>
          <li>Import to save the data to your database</li>
        </ol>
        <p className="text-xs text-muted/60 mt-3">
          Note: AI-generated data is approximate. Review and edit imported data
          in the map editor for accuracy.
        </p>
      </div>
    </div>
  );
}
