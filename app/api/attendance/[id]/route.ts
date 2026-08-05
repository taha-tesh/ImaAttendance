import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Attendance ID is required.' }, { status: 400 });
  }

  const body = await request.json();
  const entry1 = body.entry1 ?? null;
  const exit1 = body.exit1 ?? null;
  const entry2 = body.entry2 ?? null;
  const exit2 = body.exit2 ?? null;

  try {
    const result = await query(
      `UPDATE attendance
       SET entry1 = $1,
           exit1 = $2,
           entry2 = $3,
           exit2 = $4,
           updated_at = now()
       WHERE id = $5
       RETURNING id, employee_id, work_date::text AS work_date, entry1, exit1, entry2, exit2, created_at, updated_at;`,
      [entry1, exit1, entry2, exit2, id]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to update attendance row.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Attendance ID is required.' }, { status: 400 });
  }

  try {
    await query('DELETE FROM attendance WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to delete attendance row.' },
      { status: 500 }
    );
  }
}
