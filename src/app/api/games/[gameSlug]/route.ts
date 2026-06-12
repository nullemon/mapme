import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;
    const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;
    const body = await request.json();
    const { name, slug, description, image_url } = body;

    const existing = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug);
    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = existing as Record<string, unknown>;
    const now = new Date().toISOString();

    const stmt = db.prepare(
      'UPDATE games SET name = ?, slug = ?, description = ?, image_url = ?, updated_at = ? WHERE slug = ?'
    );
    stmt.run(
      name ?? game.name,
      slug ?? game.slug,
      description ?? game.description,
      image_url ?? game.image_url,
      now,
      gameSlug
    );

    const updated = db.prepare('SELECT * FROM games WHERE slug = ?').get(slug ?? gameSlug);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('Error updating game:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'A game with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string }> }
) {
  try {
    const { gameSlug } = await params;

    const existing = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug);
    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM games WHERE slug = ?').run(gameSlug);
    return NextResponse.json({ message: 'Game deleted' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
