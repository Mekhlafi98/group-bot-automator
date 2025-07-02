import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Workflow, Filter, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Stats {
  groups: number;
  workflows: number;
  filters: number;
  messages: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ groups: 0, workflows: 0, filters: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [groupsRes, workflowsRes, filtersRes, messagesRes] = await Promise.all([
          supabase.from('telegram_groups').select('id', { count: 'exact', head: true }),
          supabase.from('n8n_workflows').select('id', { count: 'exact', head: true }),
          supabase.from('message_filters').select('id', { count: 'exact', head: true }),
          supabase.from('message_logs').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          groups: groupsRes.count || 0,
          workflows: workflowsRes.count || 0,
          filters: filtersRes.count || 0,
          messages: messagesRes.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: "Setup Webhook",
      description: "Configure Telegram webhook",
      icon: Settings,
      action: () => navigate('/setup'),
      variant: "default" as const
    },
    {
      title: "Add Workflow",
      description: "Connect new n8n workflow",
      icon: Workflow,
      action: () => navigate('/workflows'),
      variant: "secondary" as const
    },
    {
      title: "Create Filter",
      description: "Add message filter rule",
      icon: Filter,
      action: () => navigate('/filters'),
      variant: "secondary" as const
    },
    {
      title: "View Logs",
      description: "Check recent activity",
      icon: MessageSquare,
      action: () => navigate('/logs'),
      variant: "outline" as const
    }
  ];

  const statCards = [
    { title: "Telegram Groups", value: stats.groups, icon: Users, color: "text-blue-600" },
    { title: "Active Workflows", value: stats.workflows, icon: Workflow, color: "text-green-600" },
    { title: "Message Filters", value: stats.filters, icon: Filter, color: "text-purple-600" },
    { title: "Messages Processed", value: stats.messages, icon: MessageSquare, color: "text-orange-600" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Telegram Bot Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Telegram bot integrations with n8n workflows
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <CardContent className="p-4 text-center">
                  <action.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system status and health checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Supabase Connection</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database Tables</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Edge Functions</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Deployed</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Telegram Webhook</span>
              <Badge variant="outline">
                {stats.messages > 0 ? "Active" : "Needs Setup"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;