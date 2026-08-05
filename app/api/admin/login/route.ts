import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

async function verifyAdmin(username: string, password: string) {
  try {
    const result = await query('SELECT verify_admin($1, $2) AS ok', [username, password]);
    return result.rows[0]?.ok === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: 'Username and password are required.' },
      { status: 400 }
    );
  }

  let ok = await verifyAdmin(username, password);

  if (!ok) {
    const fallbackUsername = process.env.ADMIN_USERNAME;
    const fallbackPassword = process.env.ADMIN_PASSWORD;
    ok =
      !!fallbackUsername &&
      !!fallbackPassword &&
      username === fallbackUsername &&
      password === fallbackPassword;
  }

  return NextResponse.json({ ok });
}
