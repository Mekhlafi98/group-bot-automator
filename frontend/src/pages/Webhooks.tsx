import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
    Plus, 
    Edit, 
    Trash2, 
    Globe, 
    Link, 
    Settings, 
    Users, 
    User, 
    Workflow, 
    Filter, 
    History, 
    Webhook, 
    Search,
    Zap,
    TestTube,
    Copy,
    Check,
    ExternalLink,
    AlertTriangle,
    Clock,
    Activity,
    Code,
    BookOpen,
    Play,
    Pause,
    MoreHorizontal
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface EntityType {
    value: string;
    label: string;
    description: string;
    icon: string;
}

interface Webhook {
    _id: string;
    url: string;
    method: string;
    entityType: string;
    events: string[];
    enabled: boolean;
    description?: string;
    payload?: string;
    headers?: Record<string, string>;
    linkedEntityId?: string;
    entityInfo?: EntityType;
    createdAt: string;
    updatedAt: string;
}

const Webhooks = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [formData, setFormData] = useState({
        url: "",
        method: "POST",
        entityType: "all",
        events: [] as string[],
        enabled: true,
        description: "",
        payload: "{{data}}",
        headers: {} as Record<string, string>,
        linkedEntityId: ""
    });
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState('active');
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch entity types
    const { data: entityTypes = [] } = useQuery({
        queryKey: ['entityTypes'],
        queryFn: async (): Promise<EntityType[]> => {
            const response = await api.get('/webhooks/entity-types');
            return response.data;
        }
    });

    // Fetch webhooks
    const { data: webhooks = [], isLoading, error } = useQuery({
        queryKey: ['webhooks'],
        queryFn: async (): Promise<Webhook[]> => {
            const response = await api.get('/webhooks');
            return response.data;
        }
    });

    // Filter webhooks based on enabled status and search query
    const filteredWebhooks = (showActiveOnly ? webhooks.filter(webhook => webhook.enabled) : webhooks)
        .filter(webhook =>
            searchQuery === "" ||
            webhook.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            webhook.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
            webhook.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (webhook.description && webhook.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const activeWebhooks = filteredWebhooks.filter(webhook => webhook.enabled);
    const inactiveWebhooks = filteredWebhooks.filter(webhook => !webhook.enabled);

    // Create webhook mutation
    const createWebhookMutation = useMutation({
        mutationFn: async (data: Omit<Webhook, '_id' | 'createdAt' | 'updatedAt' | 'entityInfo'>) => {
            const response = await api.post('/webhooks', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setIsCreateDialogOpen(false);
            setFormData({ url: "", method: "POST", entityType: "all", events: [], enabled: true, description: "", payload: "{{data}}", headers: {}, linkedEntityId: "" });
            toast({
                title: "Webhook Created Successfully",
                description: "Your webhook has been configured and is ready to receive events.",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create webhook",
                variant: "destructive"
            });
        }
    });

    // Update webhook mutation
    const updateWebhookMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Webhook> }) => {
            const response = await api.put(`/webhooks/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setEditingWebhook(null);
            setFormData({ url: "", method: "POST", entityType: "all", events: [], enabled: true, description: "", payload: "{{data}}", headers: {}, linkedEntityId: "" });
            toast({
                title: "Webhook Updated Successfully",
                description: "Your webhook configuration has been updated.",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update webhook",
                variant: "destructive"
            });
        }
    });

    // Delete webhook mutation
    const deleteWebhookMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast({
                title: "Webhook Deleted Successfully",
                description: "The webhook has been permanently removed.",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete webhook",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data for submission, handling empty linkedEntityId
        const submitData = {
            ...formData,
            events: formData.events,
            enabled: formData.enabled,
            linkedEntityId: formData.linkedEntityId && formData.linkedEntityId.trim() !== '' ? formData.linkedEntityId : undefined
        };

        if (editingWebhook) {
            updateWebhookMutation.mutate({ id: editingWebhook._id, data: submitData });
        } else {
            createWebhookMutation.mutate(submitData);
        }
    };

    const handleEdit = (webhook: Webhook) => {
        setEditingWebhook(webhook);
        setFormData({
            url: webhook.url,
            method: webhook.method || "POST",
            entityType: webhook.entityType,
            events: webhook.events,
            enabled: webhook.enabled,
            description: webhook.description || "",
            payload: webhook.payload || "{{data}}",
            headers: webhook.headers || {},
            linkedEntityId: webhook.linkedEntityId || ""
        });
    };

    const handleDelete = (id: string) => {
        deleteWebhookMutation.mutate(id);
    };

    const handleEventToggle = (event: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event]
        }));
    };

    const handleTestWebhook = async (webhook: Webhook) => {
        if (!webhook.url) {
            toast({ title: "Error", description: "Webhook URL is required for testing.", variant: "destructive" });
            return;
        }
        
        setTestingWebhook(webhook._id);
        try {
            const response = await axios({
                url: webhook.url,
                method: webhook.method as any,
                headers: { 'Content-Type': 'application/json', ...(webhook.headers || {}) },
                data: webhook.payload || '{}',
                timeout: 10000,
            });
            toast({ 
                title: "Webhook Test Successful", 
                description: `Status: ${response.status} - ${response.statusText}`,
                variant: "default" 
            });
        } catch (error: any) {
            toast({ 
                title: "Webhook Test Failed", 
                description: error?.response?.data?.message || error?.message || 'Connection timeout or server error',
                variant: "destructive" 
            });
        } finally {
            setTestingWebhook(null);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedUrl(text);
            toast({ 
                title: 'Copied!', 
                description: 'Webhook URL copied to clipboard',
                variant: 'default'
            });
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (err) {
            toast({ 
                title: 'Error', 
                description: 'Failed to copy URL', 
                variant: 'destructive' 
            });
        }
    };

    const getEntityTypeIcon = (entityType: string) => {
        switch (entityType) {
            case 'telegram-group': return <Users className="h-4 w-4" />;
            case 'contact': return <User className="h-4 w-4" />;
            case 'workflow': return <Workflow className="h-4 w-4" />;
            case 'message-filter': return <Filter className="h-4 w-4" />;
            case 'message-log': return <History className="h-4 w-4" />;
            case 'webhook': return <Webhook className="h-4 w-4" />;
            default: return <Globe className="h-4 w-4" />;
        }
    };

    const getEntityTypeLabel = (entityType: string) => {
        const entityInfo = entityTypes.find(type => type.value === entityType);
        return entityInfo ? entityInfo.label : entityType.charAt(0).toUpperCase() + entityType.slice(1).replace('-', ' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                    <p className="text-red-600 mb-2">Failed to load webhooks</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
                    <p className="text-gray-600 mt-2">
                        Configure webhooks to receive real-time notifications about data changes
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                            <Plus className="h-4 w-4" />
                            Create Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Webhook className="h-5 w-5" />
                                Create New Webhook
                            </DialogTitle>
                            <DialogDescription>
                                Configure a webhook to receive notifications about data changes in your system
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="url">Webhook URL</Label>
                                <Input
                                    id="url"
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://your-endpoint.com/webhook"
                                    required
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    The endpoint that will receive webhook notifications
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="method">HTTP Method</Label>
                                <Select
                                    value={formData.method}
                                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                                >
                                        <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="entityType">Entity Type</Label>
                                <Select
                                    value={formData.entityType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, entityType: value })
                                    }
                                >
                                        <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {entityTypes.map((entityType) => (
                                            <SelectItem key={entityType.value} value={entityType.value}>
                                                <div className="flex items-center gap-2">
                                                    {getEntityTypeIcon(entityType.value)}
                                                    <span>{entityType.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>
                                {formData.entityType !== 'all' && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        {entityTypes.find(t => t.value === formData.entityType)?.description}
                                    </p>
                                </div>
                                )}
                            <div>
                                <Label>Events to Monitor</Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {['create', 'update', 'delete'].map((event) => (
                                        <div key={event} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={event}
                                                checked={formData.events.includes(event)}
                                                onCheckedChange={() => handleEventToggle(event)}
                                            />
                                            <Label htmlFor={event} className="capitalize text-sm">{event}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what this webhook is for"
                                    rows={2}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="payload">Payload Template (Optional)</Label>
                                <Textarea
                                    id="payload"
                                    value={formData.payload}
                                    onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                    placeholder="Custom payload template. Use {{data}} for the event data."
                                    rows={3}
                                    className="mt-1 font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use <code className="bg-gray-100 px-1 rounded">{'{{data}}'}</code> to include the event data, or write custom JSON structure.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enabled"
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enabled: checked })
                                    }
                                />
                                <Label htmlFor="enabled">Enable webhook immediately</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createWebhookMutation.isPending}>
                                    {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Webhook Documentation</h3>
                                <p className="text-sm text-gray-600">Learn how to handle webhooks</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Code className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Code Examples</h3>
                                <p className="text-sm text-gray-600">Ready-to-use webhook handlers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TestTube className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Test Endpoints</h3>
                                <p className="text-sm text-gray-600">Validate your webhook setup</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search webhooks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="showActiveOnly"
                        checked={showActiveOnly}
                        onCheckedChange={setShowActiveOnly}
                    />
                    <Label htmlFor="showActiveOnly" className="text-sm">
                        Show Active Only
                    </Label>
                </div>
            </div>

            {/* Webhooks List */}
            <Card className="border-0 shadow-lg">
                        <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Webhook className="h-5 w-5 text-indigo-600" />
                        </div>
                        Your Webhooks
                                </CardTitle>
                    <CardDescription>
                        Manage and monitor your webhook configurations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active" className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Active ({activeWebhooks.length})
                            </TabsTrigger>
                            <TabsTrigger value="inactive" className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                Inactive ({inactiveWebhooks.length})
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="active" className="mt-6">
                            {activeWebhooks.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Webhook className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active webhooks</h3>
                                    <p className="text-gray-600 mb-6">
                                        Create your first webhook to start receiving real-time notifications
                                    </p>
                                    <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create Your First Webhook
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {activeWebhooks.map((webhook) => (
                                        <Card key={webhook._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-green-100 rounded-lg">
                                                            {getEntityTypeIcon(webhook.entityType)}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">{getEntityTypeLabel(webhook.entityType)}</CardTitle>
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                {webhook.method}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                                        Active
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link className="h-3 w-3 text-gray-400" />
                                                        <span className="text-sm text-gray-600 truncate">{webhook.url}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(webhook.url)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            {copiedUrl === webhook.url ? (
                                                                <Check className="h-3 w-3 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                    </div>
                                                    {webhook.description && (
                                                        <p className="text-sm text-gray-600">{webhook.description}</p>
                                )}
                                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {webhook.events.map((event) => (
                                                        <Badge key={event} variant="outline" className="capitalize text-xs">
                                            {event}
                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleTestWebhook(webhook)}
                                                            disabled={testingWebhook === webhook._id}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {testingWebhook === webhook._id ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                            ) : (
                                                                <TestTube className="h-3 w-3" />
                                                            )}
                                                            Test
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(webhook)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this webhook? This action cannot be undone and any applications relying on this webhook will stop receiving notifications.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(webhook._id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete Webhook
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="inactive" className="mt-6">
                            {inactiveWebhooks.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Pause className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No inactive webhooks</h3>
                                    <p className="text-gray-600">
                                        All your webhooks are currently active
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {inactiveWebhooks.map((webhook) => (
                                        <Card key={webhook._id} className="border-0 shadow-sm opacity-75">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-gray-100 rounded-lg">
                                                            {getEntityTypeIcon(webhook.entityType)}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">{getEntityTypeLabel(webhook.entityType)}</CardTitle>
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                {webhook.method}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary">Inactive</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link className="h-3 w-3 text-gray-400" />
                                                        <span className="text-sm text-gray-600 truncate">{webhook.url}</span>
                                                    </div>
                                                    {webhook.description && (
                                                        <p className="text-sm text-gray-600">{webhook.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(webhook)}
                                    >
                                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete this webhook? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(webhook._id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                                    Delete Webhook
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingWebhook} onOpenChange={() => setEditingWebhook(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Webhook
                        </DialogTitle>
                        <DialogDescription>
                            Update the webhook configuration
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-url">Webhook URL</Label>
                            <Input
                                id="edit-url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://your-endpoint.com/webhook"
                                required
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="edit-method">HTTP Method</Label>
                            <Select
                                value={formData.method}
                                onValueChange={(value) => setFormData({ ...formData, method: value })}
                            >
                                    <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-entityType">Entity Type</Label>
                            <Select
                                value={formData.entityType}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, entityType: value })
                                }
                            >
                                    <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {entityTypes.map((entityType) => (
                                        <SelectItem key={entityType.value} value={entityType.value}>
                                            <div className="flex items-center gap-2">
                                                {getEntityTypeIcon(entityType.value)}
                                                <span>{entityType.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Events to Monitor</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {['create', 'update', 'delete'].map((event) => (
                                    <div key={event} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-${event}`}
                                            checked={formData.events.includes(event)}
                                            onCheckedChange={() => handleEventToggle(event)}
                                        />
                                        <Label htmlFor={`edit-${event}`} className="capitalize text-sm">{event}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this webhook is for"
                                rows={2}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-payload">Payload Template (Optional)</Label>
                            <Textarea
                                id="edit-payload"
                                value={formData.payload}
                                onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                placeholder="Custom payload template. Use {{data}} for the event data."
                                rows={3}
                                className="mt-1 font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use <code className="bg-gray-100 px-1 rounded">{'{{data}}'}</code> to include the event data, or write custom JSON structure.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, enabled: checked })
                                }
                            />
                            <Label htmlFor="edit-enabled">Enable webhook</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingWebhook(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateWebhookMutation.isPending}>
                                {updateWebhookMutation.isPending ? "Updating..." : "Update Webhook"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Webhooks; 