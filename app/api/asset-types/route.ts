import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT
        at.id,
        at.name,
        at.created_at,
        (COALESCE((SELECT SUM(amount) FROM asset_funds WHERE type_id = at.id), 0) - COALESCE((SELECT SUM(total_price) FROM asset_items WHERE type_id = at.id), 0))::text AS available_amount
      FROM asset_types at
      ORDER BY at.name ASC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load asset types.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Asset type name is required.' }, { status: 400 });
  }

  try {
    const result = await query(
      'INSERT INTO asset_types (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to create asset type.' }, { status: 500 });
  }
}
