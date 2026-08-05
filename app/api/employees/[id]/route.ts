import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

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
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to delete employee.' },
      { status: 500 }
    );
  }
}
