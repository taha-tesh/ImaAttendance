import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
  }

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

  if (!workplace_id) {
    return NextResponse.json(
      { error: 'workplace_id is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE employees
       SET full_name = $1, starting_date = $2, workplace_id = $3
       WHERE id = $4
       RETURNING id, full_name, starting_date::text AS starting_date, workplace_id, created_at`,
      [full_name, starting_date, workplace_id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json(
      { error: 'Unable to update employee.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
  }

  try {
    await query('DELETE FROM employees WHERE id = $1', [id]);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to delete employee.' },
      { status: 500 }
    );
  }
}
