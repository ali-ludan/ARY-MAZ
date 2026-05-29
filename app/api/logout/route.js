import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Logout]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
