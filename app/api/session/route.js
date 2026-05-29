import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get currently authenticated user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ authenticated: false, role: null });
    }

    // Fetch user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'user'; // default fallback role

    return NextResponse.json({ authenticated: true, role });
  } catch (error) {
    console.error('[API Session]', error);
    return NextResponse.json({ authenticated: false, role: null });
  }
}
