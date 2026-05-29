import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    let role = null;
    if (username === 'admin' && password === 'admin@barari') {
      role = 'admin';
    } else if (username === 'agent' && password === 'agent@barari') {
      role = 'user';
    }

    if (!role) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('barari_session', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
