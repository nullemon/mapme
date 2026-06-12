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

    const categories = db
      .prepare('SELECT * FROM categories WHERE game_id = ? ORDER BY sort_order ASC')
      .all(game.id);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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

    const { name, slug, icon, color, parent_id, sort_order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const stmt = db.prepare(
      `INSERT INTO categories (id, game_id, name, slug, icon, color, parent_id, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      game.id,
      name,
      slug,
      icon || null,
      color || '#ff0000',
      parent_id || null,
      sort_order ?? 0,
      now
    );

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
