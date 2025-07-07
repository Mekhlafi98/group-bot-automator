import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Workflow, Filter, MessageSquare, Settings, CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/api";

interface Stats {
  groups: number;
  workflows: number;
  filters: number;
  messages: number;
}

function statusColor(status: string) {
  if (status === "operational") return "text-green-600";
  if (status === "degraded") return "text-yellow-600";
  if (status === "down") return "text-red-600";
  return "text-muted-foreground";
}

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch statistics from backend
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<Stats> => {
      const [groupsRes, workflowsRes, filtersRes, logsRes] = await Promise.all([
        api.get('/api/telegram-groups'),
        api.get('/api/workflows'),
        api.get('/api/message-filters'),
        api.get('/api/message-logs/stats')
      ]);

      return {
        groups: groupsRes.data.length || 0,
        workflows: workflowsRes.data.length || 0,
        filters: filtersRes.data.length || 0,
        messages: logsRes.data.totalMessages || 0
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: systemStatus = [], isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await api.get("/api/system-status");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

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
      description: "Connect new workflow",
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
    { title: "Groups", value: stats?.groups || 0, icon: Users, color: "text-blue-600" },
    { title: "Active Workflows", value: stats?.workflows || 0, icon: Workflow, color: "text-green-600" },
    { title: "Filters", value: stats?.filters || 0, icon: Filter, color: "text-purple-600" },
    { title: "Messages Processed", value: stats?.messages || 0, icon: MessageSquare, color: "text-orange-600" }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Bot Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your bot integrations with workflows
            </p>
          </div>
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
          {/* Dynamic System Status Records */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Health Checks</span>
              <Link to="/system-status" className="text-sm text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {statusLoading && <div className="text-muted-foreground">Loading system status...</div>}
            {statusError && <div className="text-red-600">Failed to load system status.</div>}
            <div className="space-y-2">
              {systemStatus.slice(0, 3).map((item: any) => (
                <div key={item._id} className="flex items-center gap-3 p-2 rounded border bg-muted">
                  {item.status === "operational" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {item.status === "degraded" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                  {item.status === "down" && <XCircle className="h-5 w-5 text-red-600" />}
                  <div className="flex-1 min-w-0">
                    <div className={"font-medium " + statusColor(item.status)}>{item.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.description || item.url}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {item.lastChecked ? new Date(item.lastChecked).toLocaleTimeString() : "-"}
                  </div>
                </div>
              ))}
              {systemStatus.length === 0 && !statusLoading && (
                <div className="text-muted-foreground">No system status records.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;