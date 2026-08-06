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
      'SELECT id, type_id, name, quantity, quantity_in_stock, (quantity - quantity_in_stock) AS available_quantity, unit_price::text AS unit_price, total_price::text AS total_price, created_at FROM asset_items WHERE type_id = $1 ORDER BY created_at DESC',
      [type_id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load asset items.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const type_id = typeof body.type_id === 'string' ? body.type_id : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const quantity = Number(body.quantity);
  const quantity_in_stock = Number(body.quantity_in_stock);
  const unit_price = Number(body.unit_price);

  if (
    !type_id ||
    !name ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(quantity_in_stock) ||
    quantity_in_stock < 0 ||
    !Number.isFinite(unit_price) ||
    unit_price < 0
  ) {
    return NextResponse.json({ error: 'Invalid asset item data.' }, { status: 400 });
  }

  const total_price = quantity * unit_price;

  try {
    const result = await query(
      'INSERT INTO asset_items (type_id, name, quantity, quantity_in_stock, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, type_id, name, quantity, quantity_in_stock, (quantity - quantity_in_stock) AS available_quantity, unit_price::text AS unit_price, total_price::text AS total_price, created_at',
      [type_id, name, quantity, quantity_in_stock, unit_price, total_price]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to create asset item.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Item id is required.' }, { status: 400 });
  }

  const body = await request.json();
  const type_id = typeof body.type_id === 'string' ? body.type_id : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const quantity = Number(body.quantity);
  const quantity_in_stock = Number(body.quantity_in_stock);
  const unit_price = Number(body.unit_price);

  if (
    !type_id ||
    !name ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(quantity_in_stock) ||
    quantity_in_stock < 0 ||
    !Number.isFinite(unit_price) ||
    unit_price < 0
  ) {
    return NextResponse.json({ error: 'Invalid asset item data.' }, { status: 400 });
  }

  const total_price = quantity * unit_price;

  try {
    const result = await query(
      'UPDATE asset_items SET type_id = $1, name = $2, quantity = $3, quantity_in_stock = $4, unit_price = $5, total_price = $6 WHERE id = $7 RETURNING id, type_id, name, quantity, quantity_in_stock, (quantity - quantity_in_stock) AS available_quantity, unit_price::text AS unit_price, total_price::text AS total_price, created_at',
      [type_id, name, quantity, quantity_in_stock, unit_price, total_price, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asset item not found.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update asset item.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Item id is required.' }, { status: 400 });
  }

  try {
    await query('DELETE FROM asset_items WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to delete asset item.' }, { status: 500 });
  }
}
