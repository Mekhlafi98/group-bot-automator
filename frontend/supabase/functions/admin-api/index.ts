import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handleGroupsAPI(req: Request, method: string, pathParts: string[]) {
  switch (method) {
    case 'GET':
      const { data: groups, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return new Response(JSON.stringify(groups), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'POST':
      const groupData = await req.json();
      const { data: newGroup, error: insertError } = await supabase
        .from('telegram_groups')
        .insert(groupData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      return new Response(JSON.stringify(newGroup), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    default:
      throw new Error('Method not allowed');
  }
}

async function handleWorkflowsAPI(req: Request, method: string, pathParts: string[]) {
  switch (method) {
    case 'GET':
      const { data: workflows, error } = await supabase
        .from('n8n_workflows')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return new Response(JSON.stringify(workflows), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'POST':
      const workflowData = await req.json();
      const { data: newWorkflow, error: insertError } = await supabase
        .from('n8n_workflows')
        .insert(workflowData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      return new Response(JSON.stringify(newWorkflow), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'PUT':
      if (!pathParts[2]) throw new Error('Workflow ID required');
      const updateData = await req.json();
      const { data: updatedWorkflow, error: updateError } = await supabase
        .from('n8n_workflows')
        .update(updateData)
        .eq('id', pathParts[2])
        .select()
        .single();
      
      if (updateError) throw updateError;
      return new Response(JSON.stringify(updatedWorkflow), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'DELETE':
      if (!pathParts[2]) throw new Error('Workflow ID required');
      const { error: deleteError } = await supabase
        .from('n8n_workflows')
        .delete()
        .eq('id', pathParts[2]);
      
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    default:
      throw new Error('Method not allowed');
  }
}

async function handleFiltersAPI(req: Request, method: string, pathParts: string[]) {
  switch (method) {
    case 'GET':
      const { data: filters, error } = await supabase
        .from('message_filters')
        .select(`
          *,
          telegram_groups (*),
          n8n_workflows (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return new Response(JSON.stringify(filters), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'POST':
      const filterData = await req.json();
      const { data: newFilter, error: insertError } = await supabase
        .from('message_filters')
        .insert(filterData)
        .select(`
          *,
          telegram_groups (*),
          n8n_workflows (*)
        `)
        .single();
      
      if (insertError) throw insertError;
      return new Response(JSON.stringify(newFilter), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'PUT':
      if (!pathParts[2]) throw new Error('Filter ID required');
      const updateData = await req.json();
      const { data: updatedFilter, error: updateError } = await supabase
        .from('message_filters')
        .update(updateData)
        .eq('id', pathParts[2])
        .select(`
          *,
          telegram_groups (*),
          n8n_workflows (*)
        `)
        .single();
      
      if (updateError) throw updateError;
      return new Response(JSON.stringify(updatedFilter), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'DELETE':
      if (!pathParts[2]) throw new Error('Filter ID required');
      const { error: deleteError } = await supabase
        .from('message_filters')
        .delete()
        .eq('id', pathParts[2]);
      
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    default:
      throw new Error('Method not allowed');
  }
}

async function handleLogsAPI(req: Request, method: string, pathParts: string[]) {
  if (method !== 'GET') throw new Error('Only GET method allowed for logs');

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const groupId = url.searchParams.get('group_id');

  let query = supabase
    .from('message_logs')
    .select(`
      *,
      telegram_groups (*),
      message_filters (*),
      n8n_workflows (*)
    `)
    .order('processed_at', { ascending: false })
    .limit(limit);

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  const { data: logs, error } = await query;
  
  if (error) throw error;
  return new Response(JSON.stringify(logs), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return new Response(JSON.stringify({
        message: 'Telegram Bot Admin API',
        endpoints: {
          groups: '/groups',
          workflows: '/workflows',
          filters: '/filters',
          logs: '/logs'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resource = pathParts[0];
    const method = req.method;

    switch (resource) {
      case 'groups':
        return await handleGroupsAPI(req, method, pathParts);
      case 'workflows':
        return await handleWorkflowsAPI(req, method, pathParts);
      case 'filters':
        return await handleFiltersAPI(req, method, pathParts);
      case 'logs':
        return await handleLogsAPI(req, method, pathParts);
      default:
        throw new Error('Resource not found');
    }

  } catch (error) {
    console.error('Error in admin API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});