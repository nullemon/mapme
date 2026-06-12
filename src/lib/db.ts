import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'mapme.db');

let _db: Database.Database | null = null;

export function initDb(): Database.Database {
  if (_db) return _db;

  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT UNIQUE,
      description TEXT,
      image_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS maps (
      id TEXT PRIMARY KEY,
      game_id TEXT REFERENCES games(id),
      name TEXT,
      slug TEXT,
      description TEXT,
      min_zoom INTEGER DEFAULT 1,
      max_zoom INTEGER DEFAULT 6,
      default_zoom INTEGER DEFAULT 3,
      default_lat REAL DEFAULT 0,
      default_lng REAL DEFAULT 0,
      tile_url TEXT,
      image_url TEXT,
      bounds_south REAL,
      bounds_west REAL,
      bounds_north REAL,
      bounds_east REAL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      game_id TEXT REFERENCES games(id),
      name TEXT,
      slug TEXT,
      icon TEXT,
      color TEXT DEFAULT '#ff0000',
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS pois (
      id TEXT PRIMARY KEY,
      map_id TEXT REFERENCES maps(id),
      category_id TEXT REFERENCES categories(id),
      name TEXT,
      description TEXT,
      lat REAL,
      lng REAL,
      icon TEXT,
      color TEXT,
      metadata TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      map_id TEXT REFERENCES maps(id),
      category_id TEXT REFERENCES categories(id),
      name TEXT,
      description TEXT,
      color TEXT DEFAULT '#ff0000',
      weight INTEGER DEFAULT 3,
      points TEXT,
      metadata TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS data_tables (
      id TEXT PRIMARY KEY,
      game_id TEXT REFERENCES games(id),
      name TEXT,
      slug TEXT,
      description TEXT,
      columns TEXT,
      data TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  return _db;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const database = initDb();
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  },
});
