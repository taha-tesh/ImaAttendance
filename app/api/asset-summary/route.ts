import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type_id = url.searchParams.get('type_id');
  if (!type_id) {
    return NextResponse.json({ error: 'type_id is required.' }, { status: 400 });
  }

  try {
    const items = await query(
      'SELECT id, type_id, name, quantity, quantity_in_stock, (quantity - quantity_in_stock) AS available_quantity, unit_price::text AS unit_price, total_price::text AS total_price, created_at FROM asset_items WHERE type_id = $1 ORDER BY created_at DESC',
      [type_id]
    );
    const funds = await query(
      'SELECT id, type_id, amount::text AS amount, created_at FROM asset_funds WHERE type_id = $1 ORDER BY created_at DESC',
      [type_id]
    );
    const total_item_price = items.rows.reduce((sum, row) => sum + Number(row.total_price), 0);
    const total_funds = funds.rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const balance = total_funds - total_item_price;

    return NextResponse.json({
      items: items.rows,
      funds: funds.rows,
      total_item_price: total_item_price.toFixed(2),
      total_funds: total_funds.toFixed(2),
      balance: balance.toFixed(2),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load asset summary.' }, { status: 500 });
  }
}
