import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GameRow = { id: string };
type MapRow = { id: string };
type RouteRow = Record<string, unknown>;

function findRoute(gameSlug: string, mapSlug: string, routeId: string) {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
    | GameRow
    | undefined;
  if (!game) return { game: undefined, map: undefined, route: undefined };

  const map = db
    .prepare('SELECT * FROM maps WHERE game_id = ? AND slug = ?')
    .get(game.id, mapSlug) as MapRow | undefined;
  if (!map) return { game, map: undefined, route: undefined };

  const route = db
    .prepare('SELECT * FROM routes WHERE id = ? AND map_id = ?')
    .get(routeId, map.id) as RouteRow | undefined;
  return { game, map, route };
}

export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ gameSlug: string; mapSlug: string; routeId: string }> }
) {
  try {
    const { gameSlug, mapSlug, routeId } = await params;
    const { game, map, route } = findRoute(gameSlug, mapSlug, routeId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ gameSlug: string; mapSlug: string; routeId: string }> }
) {
  try {
    const { gameSlug, mapSlug, routeId } = await params;
    const body = await request.json();
    const { game, map, route } = findRoute(gameSlug, mapSlug, routeId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    const now = new Date().toISOString();

    const stmt = db.prepare(
      `UPDATE routes SET category_id = ?, name = ?, description = ?, color = ?, weight = ?,
       points = ?, metadata = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(
      body.category_id ?? route.category_id,
      body.name ?? route.name,
      body.description ?? route.description,
      body.color ?? route.color,
      body.weight ?? route.weight,
      body.points ? JSON.stringify(body.points) : (route.points as string),
      body.metadata ? JSON.stringify(body.metadata) : (route.metadata as string | null),
      now,
      routeId
    );

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ gameSlug: string; mapSlug: string; routeId: string }> }
) {
  try {
    const { gameSlug, mapSlug, routeId } = await params;
    const { game, map, route } = findRoute(gameSlug, mapSlug, routeId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);
    return NextResponse.json({ message: 'Route deleted' });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
