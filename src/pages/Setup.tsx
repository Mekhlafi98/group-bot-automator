import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Settings, Bot, Webhook, ExternalLink, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections: number;
  allowed_updates: string[];
}

const Setup = () => {
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const { toast } = useToast();

  const webhookUrl = `https://syqylihnpygqvqpitoco.supabase.co/functions/v1/telegram-webhook`;

  const fetchWebhookInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-webhook', {
        body: { action: 'get' }
      });

      if (error) throw error;
      setWebhookInfo(data);
    } catch (error: any) {
      console.error('Error fetching webhook info:', error);
      // Don't show error toast here as webhook might not be set up yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookInfo();
  }, []);

  const handleSetWebhook = async () => {
    try {
      setWebhookLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-webhook', {
        body: { action: 'set' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Webhook configured successfully"
        });
        fetchWebhookInfo();
      } else {
        throw new Error(data.message || 'Failed to set webhook');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm("Are you sure you want to delete the webhook? This will stop message processing.")) return;

    try {
      setWebhookLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-webhook', {
        body: { action: 'delete' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Webhook deleted successfully"
        });
        setWebhookInfo(null);
      } else {
        throw new Error(data.message || 'Failed to delete webhook');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard"
    });
  };

  const isWebhookConfigured = webhookInfo?.url && webhookInfo.url.includes('telegram-webhook');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Setup & Configuration</h1>
          <p className="text-muted-foreground">
            Configure your Telegram bot webhook and system settings
          </p>
        </div>
      </div>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              <CardTitle>Telegram Webhook</CardTitle>
            </div>
            <Badge variant={isWebhookConfigured ? "default" : "secondary"}>
              {isWebhookConfigured ? "Configured" : "Not Set"}
            </Badge>
          </div>
          <CardDescription>
            Configure the webhook URL for your Telegram bot to receive messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {webhookInfo && (
                <div className="space-y-3">
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Current URL:</span>
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {webhookInfo.url || 'Not configured'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Pending Updates:</span>
                      <div className="text-muted-foreground">
                        {webhookInfo.pending_update_count}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Max Connections:</span>
                      <div className="text-muted-foreground">
                        {webhookInfo.max_connections}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Allowed Updates:</span>
                      <div className="text-muted-foreground">
                        {webhookInfo.allowed_updates.join(', ')}
                      </div>
                    </div>
                  </div>

                  {webhookInfo.last_error_message && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Last Error:</strong> {webhookInfo.last_error_message}
                        <br />
                        <span className="text-xs">
                          {webhookInfo.last_error_date && new Date(webhookInfo.last_error_date * 1000).toLocaleString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleSetWebhook} 
                  disabled={webhookLoading}
                  variant={isWebhookConfigured ? "outline" : "default"}
                >
                  {webhookLoading ? "Setting..." : isWebhookConfigured ? "Update Webhook" : "Set Webhook"}
                </Button>
                
                {isWebhookConfigured && (
                  <Button 
                    onClick={handleDeleteWebhook} 
                    disabled={webhookLoading}
                    variant="destructive"
                  >
                    {webhookLoading ? "Deleting..." : "Delete Webhook"}
                  </Button>
                )}
              </div>

              {!isWebhookConfigured && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to set up the webhook before your bot can receive messages. 
                    Click "Set Webhook" to configure it automatically.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bot Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Bot Information</CardTitle>
          </div>
          <CardDescription>
            Important information about your Telegram bot setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Bot Token:</strong> Your bot token is securely stored in Supabase secrets.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Add your bot to the Telegram groups you want to monitor</li>
              <li>Make sure your bot has admin permissions if needed</li>
              <li>Create workflows in n8n with webhook triggers</li>
              <li>Add workflows to the system using the Workflows page</li>
              <li>Create message filters to trigger your workflows</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a 
                href="https://core.telegram.org/bots/api#setwebhook" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Telegram Bot API Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Database Connection</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Edge Functions</span>
              <Badge variant="default" className="bg-green-100 text-green-800">Deployed</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Telegram Webhook</span>
              <Badge variant={isWebhookConfigured ? "default" : "secondary"}>
                {isWebhookConfigured ? "Active" : "Not Configured"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Message Processing</span>
              <Badge variant={isWebhookConfigured ? "default" : "secondary"}>
                {isWebhookConfigured ? "Ready" : "Waiting for Webhook"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;