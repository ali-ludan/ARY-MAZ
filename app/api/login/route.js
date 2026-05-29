import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    // Auto-normalize username to email format if needed (e.g. admin -> admin@barari.com)
    const email = username.includes('@') ? username : `${username}@barari.com`;

    const supabase = await createClient();
    
    // Sign in to Supabase Auth (stores session in cookies automatically via @supabase/ssr helper)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    const user = authData.user;

    // Fetch user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[profiles fetch error]', profileError);
      // Fallback default role
      return NextResponse.json({ success: true, role: 'user' });
    }

    return NextResponse.json({ success: true, role: profile.role });
  } catch (error) {
    console.error('[API Login]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
