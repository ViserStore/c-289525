
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting daily profit processing...');

    // First, let's check for orphaned user_investments and clean them up
    const { data: orphanedInvestments, error: orphanedError } = await supabaseClient
      .from('user_investments')
      .select('id, user_id')
      .not('user_id', 'in', `(SELECT id FROM users)`);

    if (orphanedError) {
      console.error('Error checking for orphaned investments:', orphanedError);
    } else if (orphanedInvestments && orphanedInvestments.length > 0) {
      console.log(`Found ${orphanedInvestments.length} orphaned investments, cleaning up...`);
      
      // Delete orphaned investments
      const { error: deleteError } = await supabaseClient
        .from('user_investments')
        .delete()
        .in('id', orphanedInvestments.map(inv => inv.id));

      if (deleteError) {
        console.error('Error deleting orphaned investments:', deleteError);
      } else {
        console.log('Successfully cleaned up orphaned investments');
      }
    }

    // Now call the stored procedure to process daily profits
    const { data, error } = await supabaseClient.rpc('process_daily_profits');

    if (error) {
      console.error('Error processing daily profits:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully processed ${data} daily profits`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${data} daily profits`,
        processed_count: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
