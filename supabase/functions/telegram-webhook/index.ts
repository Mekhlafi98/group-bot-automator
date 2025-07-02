import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name: string;
  };
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  text?: string;
  photo?: any[];
  document?: any;
  sticker?: any;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function processMessage(message: TelegramMessage) {
  console.log('Processing message:', message);

  // Store/update group info
  const { data: group, error: groupError } = await supabase
    .from('telegram_groups')
    .upsert({
      chat_id: message.chat.id,
      chat_title: message.chat.title || 'Private Chat',
      chat_type: message.chat.type,
      is_active: true
    }, {
      onConflict: 'chat_id'
    })
    .select()
    .single();

  if (groupError) {
    console.error('Error upserting group:', groupError);
    return;
  }

  // Get active filters for this group
  const { data: filters, error: filtersError } = await supabase
    .from('message_filters')
    .select(`
      *,
      n8n_workflows (*)
    `)
    .eq('group_id', group.id)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (filtersError) {
    console.error('Error fetching filters:', filtersError);
    return;
  }

  // Determine message type
  let messageType = 'text';
  if (message.photo) messageType = 'photo';
  else if (message.document) messageType = 'document';
  else if (message.sticker) messageType = 'sticker';

  // Check each filter
  for (const filter of filters) {
    let matched = false;
    const messageText = message.text || '';

    switch (filter.filter_type) {
      case 'keyword':
        matched = messageText.toLowerCase().includes(filter.filter_value.toLowerCase());
        break;
      case 'regex':
        try {
          const regex = new RegExp(filter.filter_value, 'i');
          matched = regex.test(messageText);
        } catch (e) {
          console.error('Invalid regex:', filter.filter_value);
        }
        break;
      case 'message_type':
        matched = messageType === filter.filter_value;
        break;
      case 'ai_classification':
        // AI classification will be implemented when OpenAI key is provided
        matched = false;
        break;
    }

    if (matched) {
      console.log(`Filter matched: ${filter.filter_name}`);

      // Log the message
      await supabase.from('message_logs').insert({
        group_id: group.id,
        filter_id: filter.id,
        workflow_id: filter.workflow_id,
        message_id: message.message_id,
        sender_id: message.from.id,
        sender_username: message.from.username,
        message_text: messageText,
        message_type: messageType,
        matched_filter_type: filter.filter_type,
        matched_filter_value: filter.filter_value,
        workflow_triggered: false
      });

      // Trigger n8n workflow
      try {
        const workflowPayload = {
          telegram_message: message,
          filter: filter,
          group: group,
          matched_at: new Date().toISOString()
        };

        const response = await fetch(filter.n8n_workflows.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowPayload)
        });

        const responseText = await response.text();

        // Update log with workflow response
        await supabase
          .from('message_logs')
          .update({
            workflow_triggered: true,
            workflow_response: responseText
          })
          .eq('message_id', message.message_id)
          .eq('sender_id', message.from.id);

        console.log(`Workflow triggered successfully for filter: ${filter.filter_name}`);

      } catch (error) {
        console.error(`Error triggering workflow for filter ${filter.filter_name}:`, error);
      }

      // Only trigger first matching filter (break after first match)
      break;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', update);

    if (update.message) {
      await processMessage(update.message);
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});