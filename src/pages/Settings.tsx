import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Settings, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface WebhookStatus {
  isConfigured: boolean;
  webhookUrl?: string;
  lastChecked?: string;
  status?: string;
}

const Setup = () => {
  const [botToken, setBotToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // Setup webhook mutation
  const setupWebhookMutation = useMutation({
    mutationFn: async (data: { botToken: string; webhookUrl: string }) => {
      const response = await api.post('/api/setup-webhook', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Webhook configured successfully",
        variant: "default"
      });
      setWebhookUrl(data.webhookUrl || "");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to configure webhook",
        variant: "destructive"
      });
    }
  });

  // Check webhook status mutation
  const checkWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/setup-webhook/status');
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook Status",
        description: data.isConfigured ? "Webhook is active" : "Webhook is not configured",
        variant: data.isConfigured ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check webhook status",
        variant: "destructive"
      });
    }
  });

  const handleSetupWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken || !webhookUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setupWebhookMutation.mutate({ botToken, webhookUrl });
  };

  const handleCheckStatus = () => {
    setIsChecking(true);
    checkWebhookMutation.mutate(undefined, {
      onSettled: () => setIsChecking(false)
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your bot webhook and settings
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Set up your bot webhook to receive messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupWebhook} className="space-y-4">
              <div>
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Get this from @BotFather on Telegram
                </p>
              </div>
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/telegram-webhook"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your server's webhook endpoint URL
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={setupWebhookMutation.isPending}
              >
                {setupWebhookMutation.isPending ? "Configuring..." : "Configure Webhook"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Webhook Status
            </CardTitle>
            <CardDescription>
              Check if your webhook is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleCheckStatus}
                variant="outline"
                className="w-full"
                disabled={isChecking}
              >
                {isChecking ? "Checking..." : "Check Webhook Status"}
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your server is accessible from the internet and the webhook URL is correct.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to configure your bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div>
                <h4 className="font-medium">Create a bot</h4>
                <p className="text-sm text-muted-foreground">
                  Message @BotFather on Telegram and create a new bot. Save the bot token.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <h4 className="font-medium">Deploy Your Server</h4>
                <p className="text-sm text-muted-foreground">
                  Deploy your backend server to a hosting service (Vercel, Railway, etc.) that provides HTTPS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <h4 className="font-medium">Configure Webhook</h4>
                <p className="text-sm text-muted-foreground">
                  Enter your bot token and webhook URL above, then click "Configure Webhook".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <h4 className="font-medium">Test the Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Send a message to your bot and check the logs page to see if it's working.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available endpoints for your bot integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Webhook Endpoint</h4>
                <p className="text-sm text-muted-foreground">POST /api/telegram-webhook</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${window.location.origin}/api/telegram-webhook`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Status Check</h4>
                <p className="text-sm text-muted-foreground">GET /api/setup-webhook/status</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${window.location.origin}/api/setup-webhook/status`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;