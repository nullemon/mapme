import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GameRow = { id: string };
type TableRow = Record<string, unknown>;

function findTable(gameSlug: string, tableId: string) {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
    | GameRow
    | undefined;
  if (!game) return { game: undefined, table: undefined };

  const table = db
    .prepare('SELECT * FROM data_tables WHERE id = ? AND game_id = ?')
    .get(tableId, game.id) as TableRow | undefined;
  return { game, table };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; tableId: string }> }
) {
  try {
    const { gameSlug, tableId } = await params;
    const { game, table } = findTable(gameSlug, tableId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; tableId: string }> }
) {
  try {
    const { gameSlug, tableId } = await params;
    const body = await request.json();
    const { game, table } = findTable(gameSlug, tableId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const now = new Date().toISOString();

    const stmt = db.prepare(
      `UPDATE data_tables SET name = ?, slug = ?, description = ?, columns = ?, data = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(
      body.name ?? table.name,
      body.slug ?? table.slug,
      body.description ?? table.description,
      body.columns ? JSON.stringify(body.columns) : (table.columns as string),
      body.data ? JSON.stringify(body.data) : (table.data as string),
      now,
      tableId
    );

    const updated = db.prepare('SELECT * FROM data_tables WHERE id = ?').get(tableId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; tableId: string }> }
) {
  try {
    const { gameSlug, tableId } = await params;
    const { game, table } = findTable(gameSlug, tableId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    db.prepare('DELETE FROM data_tables WHERE id = ?').run(tableId);
    return NextResponse.json({ message: 'Table deleted' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
