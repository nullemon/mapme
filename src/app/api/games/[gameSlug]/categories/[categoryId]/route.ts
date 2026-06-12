import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GameRow = { id: string };
type CategoryRow = Record<string, unknown>;

function findCategory(gameSlug: string, categoryId: string) {
  const game = db.prepare('SELECT * FROM games WHERE slug = ?').get(gameSlug) as
    | GameRow
    | undefined;
  if (!game) return { game: undefined, category: undefined };

  const category = db
    .prepare('SELECT * FROM categories WHERE id = ? AND game_id = ?')
    .get(categoryId, game.id) as CategoryRow | undefined;
  return { game, category };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; categoryId: string }> }
) {
  try {
    const { gameSlug, categoryId } = await params;
    const { game, category } = findCategory(gameSlug, categoryId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!category)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; categoryId: string }> }
) {
  try {
    const { gameSlug, categoryId } = await params;
    const body = await request.json();
    const { game, category } = findCategory(gameSlug, categoryId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!category)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const stmt = db.prepare(
      `UPDATE categories SET name = ?, slug = ?, icon = ?, color = ?, parent_id = ?, sort_order = ? WHERE id = ?`
    );
    stmt.run(
      body.name ?? category.name,
      body.slug ?? category.slug,
      body.icon ?? category.icon,
      body.color ?? category.color,
      body.parent_id ?? category.parent_id,
      body.sort_order ?? category.sort_order,
      categoryId
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; categoryId: string }> }
) {
  try {
    const { gameSlug, categoryId } = await params;
    const { game, category } = findCategory(gameSlug, categoryId);

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (!category)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
