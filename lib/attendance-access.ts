import { NextResponse } from 'next/server';

const ALLOWED_ATTENDANCE_IP = process.env.ATTENDANCE_ALLOWED_IP ?? '154.248.151.118';

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip');
}

export function requireAttendanceNetwork(request: Request): NextResponse | null {
  if (getClientIp(request) === ALLOWED_ATTENDANCE_IP) {
    return null;
  }

  return NextResponse.json(
    { error: 'Attendance can only be recorded from the company network.' },
    { status: 403 }
  );
}