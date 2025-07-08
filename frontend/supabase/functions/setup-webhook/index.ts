import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    if (action === 'set') {
      // Set webhook URL
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook`;
      
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message']
        })
      });

      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: result.ok,
        message: result.description,
        webhook_url: webhookUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get') {
      // Get webhook info
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getWebhookInfo`);
      const result = await response.json();
      
      return new Response(JSON.stringify(result.result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'delete') {
      // Delete webhook
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/deleteWebhook`);
      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: result.ok,
        message: result.description
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action. Use "set", "get", or "delete"');

  } catch (error) {
    console.error('Error in setup-webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});