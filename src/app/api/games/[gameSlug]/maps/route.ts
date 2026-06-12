import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;

    const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
      | { id: string }
      | undefined;
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const maps = db
      .prepare('SELECT * FROM maps WHERE game_id = ? ORDER BY created_at DESC')
      .all(game.id);
    return NextResponse.json(maps);
  } catch (error) {
    console.error('Error fetching maps:', error);
    return NextResponse.json({ error: 'Failed to fetch maps' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;
    const body = await request.json();

    const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
      | { id: string }
      | undefined;
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const {
      name,
      slug,
      description,
      min_zoom,
      max_zoom,
      default_zoom,
      default_lat,
      default_lng,
      tile_url,
      image_url,
      bounds_south,
      bounds_west,
      bounds_north,
      bounds_east,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      `INSERT INTO maps (id, game_id, name, slug, description, min_zoom, max_zoom, default_zoom, default_lat, default_lng, tile_url, image_url, bounds_south, bounds_west, bounds_north, bounds_east, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      game.id,
      name,
      slug,
      description || null,
      min_zoom ?? 1,
      max_zoom ?? 6,
      default_zoom ?? 3,
      default_lat ?? 0,
      default_lng ?? 0,
      tile_url || null,
      image_url || null,
      bounds_south ?? null,
      bounds_west ?? null,
      bounds_north ?? null,
      bounds_east ?? null,
      now,
      now
    );

    const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
    return NextResponse.json(map, { status: 201 });
  } catch (error) {
    console.error('Error creating map:', error);
    return NextResponse.json({ error: 'Failed to create map' }, { status: 500 });
  }
}
