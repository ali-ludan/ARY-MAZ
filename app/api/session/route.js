import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('barari_session');
  if (!session || !session.value) {
    return NextResponse.json({ authenticated: false, role: null });
  }
  return NextResponse.json({ authenticated: true, role: session.value });
}
