import { query } from '@/lib/db';
import { requireAttendanceNetwork } from '@/lib/attendance-access';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const employee_id = url.searchParams.get('employee_id');
  const date = url.searchParams.get('date');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  if (!employee_id) {
    return NextResponse.json(
      { error: 'employee_id is required.' },
      { status: 400 }
    );
  }

  try {
    if (date) {
      const result = await query(
        `SELECT id, employee_id, work_date::text AS work_date, entry1, exit1, entry2, exit2, created_at, updated_at
         FROM attendance
         WHERE employee_id = $1 AND work_date = $2`,
        [employee_id, date]
      );
      return NextResponse.json(result.rows[0] ?? null);
    }

    if (start_date && end_date) {
      const result = await query(
        `SELECT id, employee_id, work_date::text AS work_date, entry1, exit1, entry2, exit2, created_at, updated_at
         FROM attendance
         WHERE employee_id = $1 AND work_date BETWEEN $2 AND $3 ORDER BY work_date ASC`,
        [employee_id, start_date, end_date]
      );
      return NextResponse.json(result.rows);
    }

    return NextResponse.json(
      { error: 'Either date or start_date and end_date are required.' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to load attendance rows.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const accessError = requireAttendanceNetwork(request);
  if (accessError) return accessError;

  const body = await request.json();
  const employee_id = typeof body.employee_id === 'string' ? body.employee_id : '';
  const work_date = typeof body.work_date === 'string' ? body.work_date : '';
  const entry1 = body.entry1 ?? null;
  const exit1 = body.exit1 ?? null;
  const entry2 = body.entry2 ?? null;
  const exit2 = body.exit2 ?? null;

  if (!employee_id || !work_date) {
    return NextResponse.json(
      { error: 'employee_id and work_date are required.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `INSERT INTO attendance (employee_id, work_date, entry1, exit1, entry2, exit2)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, work_date)
       DO UPDATE SET
         entry1 = COALESCE(EXCLUDED.entry1, attendance.entry1),
         exit1 = COALESCE(EXCLUDED.exit1, attendance.exit1),
         entry2 = COALESCE(EXCLUDED.entry2, attendance.entry2),
         exit2 = COALESCE(EXCLUDED.exit2, attendance.exit2),
         updated_at = now()
       RETURNING id, employee_id, work_date::text AS work_date, entry1, exit1, entry2, exit2, created_at, updated_at;`,
      [employee_id, work_date, entry1, exit1, entry2, exit2]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to save attendance row.' },
      { status: 500 }
    );
  }
}
