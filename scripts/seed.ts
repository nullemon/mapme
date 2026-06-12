const Database = require("better-sqlite3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "mapme.db");

const fs = require("fs");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    min_zoom INTEGER DEFAULT 1,
    max_zoom INTEGER DEFAULT 6,
    default_zoom INTEGER DEFAULT 3,
    default_lat REAL DEFAULT 0,
    default_lng REAL DEFAULT 0,
    tile_url TEXT,
    image_url TEXT,
    bounds_south REAL DEFAULT -256,
    bounds_west REAL DEFAULT -256,
    bounds_north REAL DEFAULT 256,
    bounds_east REAL DEFAULT 256,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT,
    color TEXT DEFAULT '#ff0000',
    parent_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS pois (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    icon TEXT,
    color TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#ff0000',
    weight INTEGER DEFAULT 3,
    points TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS data_tables (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    columns TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

const wowId = uuidv4();
db.prepare(`INSERT INTO games (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)`).run(
  wowId,
  "World of Warcraft",
  "world-of-warcraft",
  "Explore Azeroth with interactive maps for herbs, mining nodes, quest givers, NPCs, and farming routes.",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400"
);

const pokemonId = uuidv4();
db.prepare(`INSERT INTO games (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)`).run(
  pokemonId,
  "Pokemon GO",
  "pokemon-go",
  "Find Pokemon nests, Pokestops, Gyms, raid locations, and community day routes.",
  "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400"
);

const elwynnId = uuidv4();
db.prepare(`INSERT INTO maps (id, game_id, name, slug, description, default_zoom, min_zoom, max_zoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
  elwynnId, wowId, "Elwynn Forest", "elwynn-forest", "The peaceful human starting zone surrounding Stormwind City.", 3, 1, 6
);

const azerothId = uuidv4();
db.prepare(`INSERT INTO maps (id, game_id, name, slug, description, default_zoom, min_zoom, max_zoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
  azerothId, wowId, "Eastern Kingdoms", "eastern-kingdoms", "The eastern continent of Azeroth.", 2, 1, 5
);

const pokemonMapId = uuidv4();
db.prepare(`INSERT INTO maps (id, game_id, name, slug, description, default_zoom, min_zoom, max_zoom) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
  pokemonMapId, pokemonId, "Central Park", "central-park", "Pokemon GO hotspots in Central Park, NYC.", 3, 1, 6
);

const herbsId = uuidv4();
const miningId = uuidv4();
const questsId = uuidv4();
const npcsId = uuidv4();
const vendorsId = uuidv4();
const farmingId = uuidv4();

const cats = [
  [herbsId, wowId, "Herbs", "herbs", "leaf", "#22c55e", null, 1],
  [miningId, wowId, "Mining Nodes", "mining-nodes", "gem", "#f59e0b", null, 2],
  [questsId, wowId, "Quests", "quests", "scroll", "#eab308", null, 3],
  [npcsId, wowId, "NPCs", "npcs", "user", "#3b82f6", null, 4],
  [vendorsId, wowId, "Vendors", "vendors", "shopping-bag", "#a855f7", null, 5],
  [farmingId, wowId, "Farming Routes", "farming-routes", "route", "#ef4444", null, 6],
];

const catStmt = db.prepare(`INSERT INTO categories (id, game_id, name, slug, icon, color, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
for (const cat of cats) {
  catStmt.run(...cat);
}

const pokeCats = [
  [uuidv4(), pokemonId, "Pokemon Nests", "pokemon-nests", "pokeball", "#ef4444", null, 1],
  [uuidv4(), pokemonId, "Pokestops", "pokestops", "map-pin", "#3b82f6", null, 2],
  [uuidv4(), pokemonId, "Gyms", "gyms", "dumbbell", "#f59e0b", null, 3],
  [uuidv4(), pokemonId, "Raid Spots", "raid-spots", "star", "#a855f7", null, 4],
];
for (const cat of pokeCats) {
  catStmt.run(...cat);
}

const poiStmt = db.prepare(`INSERT INTO pois (id, map_id, category_id, name, description, lat, lng, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const herbPois = [
  ["Peacebloom", "Common herb found in starting zones", 50, 30],
  ["Silverleaf", "Found near trees in low-level zones", -20, 45],
  ["Earthroot", "Found near rocks and cliffs", 80, -60],
  ["Mageroyal", "Found in open fields", -45, -30],
  ["Briarthorn", "Found in 15-25 zones", 100, 80],
  ["Stranglekelp", "Found underwater along coastlines", -80, 120],
  ["Bruiseweed", "Found in contested territories", 30, -90],
  ["Wild Steelbloom", "Found on hillsides", 60, 50],
];

for (const [name, desc, lat, lng] of herbPois) {
  poiStmt.run(uuidv4(), elwynnId, herbsId, name, desc, lat, lng, "leaf", "#22c55e");
}

const miningPois = [
  ["Copper Vein", "Most common low-level mining node", 25, 60],
  ["Tin Vein", "Found in 15-30 zones", -35, 70],
  ["Silver Vein", "Rare spawn, replaces tin veins", 90, -20],
  ["Iron Deposit", "Found in 30-40 zones", -60, -80],
  ["Gold Vein", "Rare spawn, replaces iron deposits", 40, -40],
];

for (const [name, desc, lat, lng] of miningPois) {
  poiStmt.run(uuidv4(), elwynnId, miningId, name, desc, lat, lng, "gem", "#f59e0b");
}

const questPois = [
  ["Marshal Dughan", "Quest giver in Goldshire", 10, 15],
  ["Deputy Willem", "Quest giver at Northshire Abbey", -10, 5],
  ["Milly Osworth", "Gives grape harvest quest", -15, 10],
  ["Brother Neals", "Spiritual guidance quests", -5, 20],
];

for (const [name, desc, lat, lng] of questPois) {
  poiStmt.run(uuidv4(), elwynnId, questsId, name, desc, lat, lng, "scroll", "#eab308");
}

const npcPois = [
  ["Guard Thomas", "Eastvale guard captain", 70, 100],
  ["Smith Argus", "Blacksmithing trainer", 15, 20],
  ["Tharynn Bouden", "Trade goods vendor", 20, 25],
];

for (const [name, desc, lat, lng] of npcPois) {
  poiStmt.run(uuidv4(), elwynnId, npcsId, name, desc, lat, lng, "user", "#3b82f6");
}

const routeStmt = db.prepare(`INSERT INTO routes (id, map_id, category_id, name, description, color, weight, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

routeStmt.run(
  uuidv4(), elwynnId, farmingId,
  "Peacebloom Circuit",
  "Efficient route for farming Peacebloom in Elwynn Forest",
  "#22c55e", 3,
  JSON.stringify([[50, 30], [40, 45], [20, 60], [-10, 50], [-30, 30], [-20, 10], [10, -10], [30, 5], [50, 30]])
);

routeStmt.run(
  uuidv4(), elwynnId, farmingId,
  "Copper Ore Run",
  "Mining route for Copper Ore around Goldshire area",
  "#f59e0b", 3,
  JSON.stringify([[25, 60], [35, 80], [50, 70], [60, 50], [40, 30], [25, 60]])
);

const tableId = uuidv4();
db.prepare(`INSERT INTO data_tables (id, game_id, name, slug, description, columns, data) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
  tableId, wowId,
  "Herb Gathering Stats",
  "herb-gathering-stats",
  "Herb spawn rates and gathering data for Elwynn Forest",
  JSON.stringify([
    { key: "herb", label: "Herb", sortable: true },
    { key: "level", label: "Required Level", sortable: true },
    { key: "zone", label: "Zone", sortable: true },
    { key: "spawn_rate", label: "Spawn Rate", sortable: true },
    { key: "sell_price", label: "Sell Price (gold)", sortable: true },
  ]),
  JSON.stringify([
    { herb: "Peacebloom", level: 1, zone: "Elwynn Forest", spawn_rate: "High", sell_price: "0.05" },
    { herb: "Silverleaf", level: 1, zone: "Elwynn Forest", spawn_rate: "High", sell_price: "0.05" },
    { herb: "Earthroot", level: 15, zone: "Elwynn Forest", spawn_rate: "Medium", sell_price: "0.10" },
    { herb: "Mageroyal", level: 50, zone: "Elwynn Forest", spawn_rate: "Medium", sell_price: "0.25" },
    { herb: "Briarthorn", level: 70, zone: "Loch Modan", spawn_rate: "Medium", sell_price: "0.50" },
    { herb: "Stranglekelp", level: 85, zone: "Coastlines", spawn_rate: "Low", sell_price: "1.00" },
    { herb: "Bruiseweed", level: 100, zone: "Contested", spawn_rate: "Low", sell_price: "0.75" },
    { herb: "Wild Steelbloom", level: 115, zone: "Hillsides", spawn_rate: "Low", sell_price: "1.50" },
  ])
);

console.log("Database seeded successfully!");
console.log(`  Games: 2`);
console.log(`  Maps: 3`);
console.log(`  Categories: ${cats.length + pokeCats.length}`);
console.log(`  POIs: ${herbPois.length + miningPois.length + questPois.length + npcPois.length}`);
console.log(`  Routes: 2`);
console.log(`  Tables: 1`);

db.close();
