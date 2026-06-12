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

    const routes = db
      .prepare('SELECT * FROM routes WHERE map_id = ? ORDER BY created_at DESC')
      .all(map.id);
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
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

    const { name, category_id, description, color, weight, points, metadata } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      `INSERT INTO routes (id, map_id, category_id, name, description, color, weight, points, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      map.id,
      category_id || null,
      name,
      description || null,
      color || '#ff0000',
      weight ?? 3,
      points ? JSON.stringify(points) : '[]',
      metadata ? JSON.stringify(metadata) : null,
      now,
      now
    );

    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}
