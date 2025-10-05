import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Session prüfen (mit Client-Supabase)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const email = session.user.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Keine E-Mail gefunden' },
        { status: 400 }
      );
    }

    // 2. Mit Service-Role-Key prüfen, ob Runner existiert
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: existingRunner } = await supabaseAdmin
      .from('runners')
      .select('id, display_name, is_admin')
      .eq('auth_user', userId)
      .maybeSingle();

    // 3. Falls Runner existiert, zurückgeben
    if (existingRunner) {
      return NextResponse.json({
        success: true,
        runner: existingRunner,
        created: false
      });
    }

    // 4. Runner erstellen (mit Service-Role)
    const displayName = email.split('@')[0];
    
    const { data: newRunner, error: insertError } = await supabaseAdmin
      .from('runners')
      .insert({
        auth_user: userId,
        email: email,
        display_name: displayName,
        is_admin: false
      })
      .select('id, display_name, is_admin')
      .single();

    if (insertError) {
      console.error('Error creating runner:', insertError);
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Runner-Accounts: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      runner: newRunner,
      created: true
    });

  } catch (error) {
    console.error('Unexpected error in ensure-runner:', error);
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}