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

    const tables = db
      .prepare('SELECT * FROM data_tables WHERE game_id = ? ORDER BY created_at DESC')
      .all(game.id);
    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
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

    const { name, slug, description, columns, data } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      `INSERT INTO data_tables (id, game_id, name, slug, description, columns, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      game.id,
      name,
      slug,
      description || null,
      columns ? JSON.stringify(columns) : '[]',
      data ? JSON.stringify(data) : '[]',
      now,
      now
    );

    const table = db.prepare('SELECT * FROM data_tables WHERE id = ?').get(id);
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
