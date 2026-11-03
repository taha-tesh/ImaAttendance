import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT e.id, e.full_name, e.starting_date::text AS starting_date,
              e.workplace_id, w.name AS workplace_name, e.created_at
       FROM employees e
       LEFT JOIN workplaces w ON w.id = e.workplace_id
       ORDER BY e.full_name ASC`
    );
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json(
      { error: 'Unable to load employees.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const starting_date = typeof body.starting_date === 'string' ? body.starting_date : '';
  const workplace_id =
    typeof body.workplace_id === 'string' && body.workplace_id.trim()
      ? body.workplace_id.trim()
      : null;

  if (!full_name || !starting_date) {
    return NextResponse.json(
      { error: 'Missing full_name or starting_date.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `INSERT INTO employees (full_name, starting_date, workplace_id)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, starting_date::text AS starting_date, workplace_id, created_at`,
      [full_name, starting_date, workplace_id]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to create employee.' },
      { status: 500 }
    );
  }
}
