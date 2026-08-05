import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, full_name, starting_date, created_at FROM employees ORDER BY full_name ASC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
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

  if (!full_name || !starting_date) {
    return NextResponse.json(
      { error: 'Missing full_name or starting_date.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'INSERT INTO employees (full_name, starting_date) VALUES ($1, $2) RETURNING id, full_name, starting_date, created_at',
      [full_name, starting_date]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to create employee.' },
      { status: 500 }
    );
  }
}
