import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, image_url } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      'INSERT INTO games (id, name, slug, description, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, slug, description || null, image_url || null, now, now);

    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating game:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'A game with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
