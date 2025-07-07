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
import { Plus, Edit, Trash2, Globe, Link, Settings, Users, User, Workflow, Filter, History, Webhook, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch entity types
    const { data: entityTypes = [] } = useQuery({
        queryKey: ['entityTypes'],
        queryFn: async (): Promise<EntityType[]> => {
            const response = await api.get('/api/webhooks/entity-types');
            return response.data;
        }
    });

    // Fetch webhooks
    const { data: webhooks = [], isLoading, error } = useQuery({
        queryKey: ['webhooks'],
        queryFn: async (): Promise<Webhook[]> => {
            const response = await api.get('/api/webhooks');
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

    // Create webhook mutation
    const createWebhookMutation = useMutation({
        mutationFn: async (data: Omit<Webhook, '_id' | 'createdAt' | 'updatedAt' | 'entityInfo'>) => {
            const response = await api.post('/api/webhooks', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setIsCreateDialogOpen(false);
            setFormData({ url: "", method: "POST", entityType: "all", events: [], enabled: true, description: "", payload: "{{data}}", headers: {}, linkedEntityId: "" });
            toast({
                title: "Success",
                description: "Webhook created successfully",
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
            const response = await api.put(`/api/webhooks/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setEditingWebhook(null);
            setFormData({ url: "", method: "POST", entityType: "all", events: [], enabled: true, description: "", payload: "{{data}}", headers: {}, linkedEntityId: "" });
            toast({
                title: "Success",
                description: "Webhook updated successfully",
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
            await api.delete(`/api/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast({
                title: "Success",
                description: "Webhook deleted successfully",
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
                    <p className="text-muted-foreground">
                        Manage webhooks for automated actions on your data
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="showActiveOnly"
                            checked={showActiveOnly}
                            onChange={(e) => setShowActiveOnly(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="showActiveOnly" className="text-sm">
                            Show Active Only
                        </Label>
                    </div>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Webhook</DialogTitle>
                            <DialogDescription>
                                Configure a new webhook to receive notifications about data changes
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
                                />
                            </div>
                            <div>
                                <Label htmlFor="method">HTTP Method</Label>
                                <Select
                                    value={formData.method}
                                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                                >
                                    <SelectTrigger>
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
                                    <SelectTrigger>
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
                                {formData.entityType !== 'all' && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {entityTypes.find(t => t.value === formData.entityType)?.description}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label>Events</Label>
                                <div className="space-y-2 mt-2">
                                    {['create', 'update', 'delete'].map((event) => (
                                        <div key={event} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={event}
                                                checked={formData.events.includes(event)}
                                                onCheckedChange={() => handleEventToggle(event)}
                                            />
                                            <Label htmlFor={event} className="capitalize">{event}</Label>
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
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="payload">Payload Template (Optional)</Label>
                                <Textarea
                                    id="payload"
                                    value={formData.payload}
                                    onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                    placeholder="Custom payload template. Use {{data}} for the event data."
                                    rows={4}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Use <code>{'{{data}}'}</code> to include the event data, or write custom JSON structure.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="enabled"
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enabled: checked as boolean })
                                    }
                                />
                                <Label htmlFor="enabled">Enabled</Label>
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

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search webhooks by URL, method, entity type, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWebhooks.map((webhook) => (
                    <Card key={webhook._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {getEntityTypeIcon(webhook.entityType)}
                                    {getEntityTypeLabel(webhook.entityType)}
                                </CardTitle>
                                <div className="flex gap-1">
                                    <Badge variant={webhook.enabled ? "default" : "secondary"}>
                                        {webhook.enabled ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription className="break-all">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                        {webhook.method}
                                    </Badge>
                                    <span>{webhook.url}</span>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {webhook.description && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-sm text-muted-foreground">Description:</span>
                                        <span className="text-sm">{webhook.description}</span>
                                    </div>
                                )}
                                {webhook.payload && webhook.payload !== '{{data}}' && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-sm text-muted-foreground">Payload:</span>
                                        <span className="text-sm font-mono text-xs bg-muted p-1 rounded">
                                            {webhook.payload.length > 50 ? webhook.payload.substring(0, 50) + '...' : webhook.payload}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {webhook.events.map((event) => (
                                        <Badge key={event} variant="outline" className="capitalize">
                                            {event}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(webhook)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
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
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingWebhook} onOpenChange={() => setEditingWebhook(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Webhook</DialogTitle>
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
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-method">HTTP Method</Label>
                            <Select
                                value={formData.method}
                                onValueChange={(value) => setFormData({ ...formData, method: value })}
                            >
                                <SelectTrigger>
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
                                <SelectTrigger>
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
                            {formData.entityType !== 'all' && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {entityTypes.find(t => t.value === formData.entityType)?.description}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Events</Label>
                            <div className="space-y-2 mt-2">
                                {['create', 'update', 'delete'].map((event) => (
                                    <div key={event} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-${event}`}
                                            checked={formData.events.includes(event)}
                                            onCheckedChange={() => handleEventToggle(event)}
                                        />
                                        <Label htmlFor={`edit-${event}`} className="capitalize">{event}</Label>
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
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-payload">Payload Template (Optional)</Label>
                            <Textarea
                                id="edit-payload"
                                value={formData.payload}
                                onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                                placeholder="Custom payload template. Use {{data}} for the event data."
                                rows={4}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Use <code>{'{{data}}'}</code> to include the event data, or write custom JSON structure.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, enabled: checked as boolean })
                                }
                            />
                            <Label htmlFor="edit-enabled">Enabled</Label>
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