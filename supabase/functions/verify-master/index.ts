import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DENY = new Response(
    JSON.stringify({ is_master: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
);

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return DENY;

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return DENY;

        // Verificamos si tiene el flag is_master en app_metadata
        // Este campo solo puede ser editado por un administrador (vía SQL o Dashboard)
        const is_master = user.app_metadata?.is_master === true;

        return new Response(
            JSON.stringify({ is_master }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch {
        return DENY;
    }
});
