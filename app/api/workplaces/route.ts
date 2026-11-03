import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function clockToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function computeTotalMinutes(start: string, end: string, breakMinutes: number): number | null {
  const span = clockToMinutes(end) - clockToMinutes(start);
  if (span <= 0) return null;
  const total = span - breakMinutes;
  return total > 0 ? total : null;
}

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name,
              to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time, 'HH24:MI') AS end_time,
              break_minutes, total_minutes, created_at
       FROM workplaces
       ORDER BY name ASC`
    );
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Unable to load workplaces.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const start_time = normalizeTime(body.start_time);
  const end_time = normalizeTime(body.end_time);
  const break_minutes = Number(body.break_minutes ?? 60);

  if (!name || !start_time || !end_time || !Number.isFinite(break_minutes) || break_minutes < 0) {
    return NextResponse.json(
      { error: 'name, start_time, end_time and a valid break_minutes are required.' },
      { status: 400 }
    );
  }

  const total_minutes = computeTotalMinutes(start_time, end_time, break_minutes);
  if (total_minutes === null) {
    return NextResponse.json(
      { error: 'Invalid working hours: end must be after start and total work time must be positive.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `INSERT INTO workplaces (name, start_time, end_time, break_minutes, total_minutes)
       VALUES ($1, $2::time, $3::time, $4, $5)
       RETURNING id, name,
                 to_char(start_time, 'HH24:MI') AS start_time,
                 to_char(end_time, 'HH24:MI') AS end_time,
                 break_minutes, total_minutes, created_at`,
      [name, start_time, end_time, break_minutes, total_minutes]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create workplace.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Workplace id is required.' }, { status: 400 });
  }

  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const start_time = normalizeTime(body.start_time);
  const end_time = normalizeTime(body.end_time);
  const break_minutes = Number(body.break_minutes ?? 60);

  if (!name || !start_time || !end_time || !Number.isFinite(break_minutes) || break_minutes < 0) {
    return NextResponse.json(
      { error: 'name, start_time, end_time and a valid break_minutes are required.' },
      { status: 400 }
    );
  }

  const total_minutes = computeTotalMinutes(start_time, end_time, break_minutes);
  if (total_minutes === null) {
    return NextResponse.json(
      { error: 'Invalid working hours: end must be after start and total work time must be positive.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE workplaces
       SET name = $1, start_time = $2::time, end_time = $3::time,
           break_minutes = $4, total_minutes = $5
       WHERE id = $6
       RETURNING id, name,
                 to_char(start_time, 'HH24:MI') AS start_time,
                 to_char(end_time, 'HH24:MI') AS end_time,
                 break_minutes, total_minutes, created_at`,
      [name, start_time, end_time, break_minutes, total_minutes, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workplace not found.' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'Unable to update workplace.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Workplace id is required.' }, { status: 400 });
  }

  try {
    await query('DELETE FROM workplaces WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Unable to delete workplace.' }, { status: 500 });
  }
}
