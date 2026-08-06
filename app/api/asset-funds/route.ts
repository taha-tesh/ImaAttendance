import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type_id = url.searchParams.get('type_id');
  if (!type_id) {
    return NextResponse.json({ error: 'type_id is required.' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT id, type_id, amount::text AS amount, created_at FROM asset_funds WHERE type_id = $1 ORDER BY created_at DESC',
      [type_id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load funds.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const type_id = typeof body.type_id === 'string' ? body.type_id : '';
  const amount = Number(body.amount);

  if (!type_id || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid fund data.' }, { status: 400 });
  }

  try {
    const result = await query(
      'INSERT INTO asset_funds (type_id, amount) VALUES ($1, $2) RETURNING id, type_id, amount::text AS amount, created_at',
      [type_id, amount]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to create fund entry.' }, { status: 500 });
  }
}
