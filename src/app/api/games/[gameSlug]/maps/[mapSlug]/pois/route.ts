import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

type GameRow = { id: string };
type MapRow = { id: string };

function findMap(gameSlug: string, mapSlug: string) {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
    | GameRow
    | undefined;
  if (!game) return { game: undefined, map: undefined };

  const map = db
    .prepare('SELECT * FROM maps WHERE game_id = ? AND slug = ?')
    .get(game.id, mapSlug) as MapRow | undefined;
  return { game, map };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string }> }
) {
  try {
    const { gameSlug, mapSlug } = await params;
    const { game, map } = findMap(gameSlug, mapSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');

    let pois;
    if (categoryId) {
      pois = db
        .prepare(
          'SELECT * FROM pois WHERE map_id = ? AND category_id = ? ORDER BY created_at DESC'
        )
        .all(map.id, categoryId);
    } else {
      pois = db
        .prepare('SELECT * FROM pois WHERE map_id = ? ORDER BY created_at DESC')
        .all(map.id);
    }

    return NextResponse.json(pois);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return NextResponse.json({ error: 'Failed to fetch POIs' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string }> }
) {
  try {
    const { gameSlug, mapSlug } = await params;
    const body = await request.json();
    const { game, map } = findMap(gameSlug, mapSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    const { name, category_id, description, lat, lng, icon, color, metadata } = body;

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Name, lat, and lng are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      `INSERT INTO pois (id, map_id, category_id, name, description, lat, lng, icon, color, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      map.id,
      category_id || null,
      name,
      description || null,
      lat,
      lng,
      icon || null,
      color || null,
      metadata ? JSON.stringify(metadata) : null,
      now,
      now
    );

    const poi = db.prepare('SELECT * FROM pois WHERE id = ?').get(id);
    return NextResponse.json(poi, { status: 201 });
  } catch (error) {
    console.error('Error creating POI:', error);
    return NextResponse.json({ error: 'Failed to create POI' }, { status: 500 });
  }
}
