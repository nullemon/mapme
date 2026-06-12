import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GameRow = { id: string };
type MapRow = Record<string, unknown>;

function findGameAndMap(gameSlug: string, mapSlug: string) {
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
    const { game, map } = findGameAndMap(gameSlug, mapSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    return NextResponse.json(map);
  } catch (error) {
    console.error('Error fetching map:', error);
    return NextResponse.json({ error: 'Failed to fetch map' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string }> }
) {
  try {
    const { gameSlug, mapSlug } = await params;
    const body = await request.json();
    const { game, map } = findGameAndMap(gameSlug, mapSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(
      `UPDATE maps SET name = ?, slug = ?, description = ?, min_zoom = ?, max_zoom = ?, default_zoom = ?,
       default_lat = ?, default_lng = ?, tile_url = ?, image_url = ?,
       bounds_south = ?, bounds_west = ?, bounds_north = ?, bounds_east = ?, updated_at = ?
       WHERE id = ?`
    );
    stmt.run(
      body.name ?? map.name,
      body.slug ?? map.slug,
      body.description ?? map.description,
      body.min_zoom ?? map.min_zoom,
      body.max_zoom ?? map.max_zoom,
      body.default_zoom ?? map.default_zoom,
      body.default_lat ?? map.default_lat,
      body.default_lng ?? map.default_lng,
      body.tile_url ?? map.tile_url,
      body.image_url ?? map.image_url,
      body.bounds_south ?? map.bounds_south,
      body.bounds_west ?? map.bounds_west,
      body.bounds_north ?? map.bounds_north,
      body.bounds_east ?? map.bounds_east,
      now,
      map.id
    );

    const updated = db.prepare('SELECT * FROM maps WHERE id = ?').get(map.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating map:', error);
    return NextResponse.json({ error: 'Failed to update map' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string }> }
) {
  try {
    const { gameSlug, mapSlug } = await params;
    const { game, map } = findGameAndMap(gameSlug, mapSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM maps WHERE id = ?').run(map.id);
    return NextResponse.json({ message: 'Map deleted' });
  } catch (error) {
    console.error('Error deleting map:', error);
    return NextResponse.json({ error: 'Failed to delete map' }, { status: 500 });
  }
}
