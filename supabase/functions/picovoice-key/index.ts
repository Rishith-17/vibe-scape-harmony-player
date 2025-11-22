import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with SERVICE_ROLE key for secure access
    // Note: JWT verification is disabled in config.toml - frontend ensures only
    // authenticated users call this function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[picovoice-key] Fetching Picovoice access key from secrets');

    // Fetch Picovoice access key from secrets table using SERVICE_ROLE
    // This bypasses RLS and ensures secure server-side only access
    const { data, error } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', 'PICOVOICE_ACCESS_KEY')
      .single();

    if (error || !data) {
      console.error('[picovoice-key] Failed to fetch key:', error);
      return new Response(
        JSON.stringify({ error: 'Access key not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[picovoice-key] Successfully retrieved key');

    return new Response(
      JSON.stringify({ accessKey: data.value }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[picovoice-key] Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
