import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GameRow = { id: string };
type MapRow = { id: string };
type PoiRow = Record<string, unknown>;

function findPoi(gameSlug: string, mapSlug: string, poiId: string) {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
    | GameRow
    | undefined;
  if (!game) return { game: undefined, map: undefined, poi: undefined };

  const map = db
    .prepare('SELECT * FROM maps WHERE game_id = ? AND slug = ?')
    .get(game.id, mapSlug) as MapRow | undefined;
  if (!map) return { game, map: undefined, poi: undefined };

  const poi = db
    .prepare('SELECT * FROM pois WHERE id = ? AND map_id = ?')
    .get(poiId, map.id) as PoiRow | undefined;
  return { game, map, poi };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string; poiId: string }> }
) {
  try {
    const { gameSlug, mapSlug, poiId } = await params;
    const { game, map, poi } = findPoi(gameSlug, mapSlug, poiId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!poi) return NextResponse.json({ error: 'POI not found' }, { status: 404 });

    return NextResponse.json(poi);
  } catch (error) {
    console.error('Error fetching POI:', error);
    return NextResponse.json({ error: 'Failed to fetch POI' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string; poiId: string }> }
) {
  try {
    const { gameSlug, mapSlug, poiId } = await params;
    const body = await request.json();
    const { game, map, poi } = findPoi(gameSlug, mapSlug, poiId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!poi) return NextResponse.json({ error: 'POI not found' }, { status: 404 });

    const now = new Date().toISOString();

    const stmt = db.prepare(
      `UPDATE pois SET category_id = ?, name = ?, description = ?, lat = ?, lng = ?,
       icon = ?, color = ?, metadata = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(
      body.category_id ?? poi.category_id,
      body.name ?? poi.name,
      body.description ?? poi.description,
      body.lat ?? poi.lat,
      body.lng ?? poi.lng,
      body.icon ?? poi.icon,
      body.color ?? poi.color,
      body.metadata ? JSON.stringify(body.metadata) : (poi.metadata as string | null),
      now,
      poiId
    );

    const updated = db.prepare('SELECT * FROM pois WHERE id = ?').get(poiId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating POI:', error);
    return NextResponse.json({ error: 'Failed to update POI' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string; poiId: string }> }
) {
  try {
    const { gameSlug, mapSlug, poiId } = await params;
    const { game, map, poi } = findPoi(gameSlug, mapSlug, poiId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!poi) return NextResponse.json({ error: 'POI not found' }, { status: 404 });

    db.prepare('DELETE FROM pois WHERE id = ?').run(poiId);
    return NextResponse.json({ message: 'POI deleted' });
  } catch (error) {
    console.error('Error deleting POI:', error);
    return NextResponse.json({ error: 'Failed to delete POI' }, { status: 500 });
  }
}
