import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageFilter {
  id: string;
  filter_name: string;
  filter_type: string;
  filter_value: string;
  priority: number;
  ai_prompt?: string;
  is_active: boolean;
  created_at: string;
  telegram_groups: {
    id: string;
    chat_title: string;
  };
  n8n_workflows: {
    id: string;
    name: string;
  };
}

interface TelegramGroup {
  id: string;
  chat_title: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
}

const Filters = () => {
  const [filters, setFilters] = useState<MessageFilter[]>([]);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MessageFilter | null>(null);
  const [formData, setFormData] = useState({
    filter_name: "",
    filter_type: "keyword",
    filter_value: "",
    priority: 0,
    ai_prompt: "",
    group_id: "",
    workflow_id: ""
  });
  const { toast } = useToast();

  const filterTypes = [
    { value: "keyword", label: "Keyword Match" },
    { value: "regex", label: "Regex Pattern" },
    { value: "message_type", label: "Message Type" },
    { value: "ai_classification", label: "AI Classification" }
  ];

  const messageTypes = [
    { value: "text", label: "Text" },
    { value: "photo", label: "Photo" },
    { value: "document", label: "Document" },
    { value: "sticker", label: "Sticker" }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [filtersRes, groupsRes, workflowsRes] = await Promise.all([
        supabase
          .from('message_filters')
          .select(`
            *,
            telegram_groups (id, chat_title),
            n8n_workflows (id, name)
          `)
          .order('priority', { ascending: false }),
        supabase
          .from('telegram_groups')
          .select('id, chat_title')
          .eq('is_active', true),
        supabase
          .from('n8n_workflows')
          .select('id, name')
          .eq('is_active', true)
      ]);

      if (filtersRes.error) throw filtersRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (workflowsRes.error) throw workflowsRes.error;

      setFilters(filtersRes.data || []);
      setGroups(groupsRes.data || []);
      setWorkflows(workflowsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.filter_name || !formData.filter_value || !formData.group_id || !formData.workflow_id) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const submitData = {
        filter_name: formData.filter_name,
        filter_type: formData.filter_type,
        filter_value: formData.filter_value,
        priority: formData.priority,
        group_id: formData.group_id,
        workflow_id: formData.workflow_id,
        ...(formData.filter_type === 'ai_classification' && { ai_prompt: formData.ai_prompt })
      };

      if (editingFilter) {
        const { error } = await supabase
          .from('message_filters')
          .update(submitData)
          .eq('id', editingFilter.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Filter updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('message_filters')
          .insert({
            ...submitData,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Filter created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingFilter(null);
      setFormData({
        filter_name: "",
        filter_type: "keyword",
        filter_value: "",
        priority: 0,
        ai_prompt: "",
        group_id: "",
        workflow_id: ""
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (filter: MessageFilter) => {
    setEditingFilter(filter);
    setFormData({
      filter_name: filter.filter_name,
      filter_type: filter.filter_type,
      filter_value: filter.filter_value,
      priority: filter.priority,
      ai_prompt: filter.ai_prompt || "",
      group_id: filter.telegram_groups.id,
      workflow_id: filter.n8n_workflows.id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (filterId: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    try {
      const { error } = await supabase
        .from('message_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Filter deleted successfully"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleFilterStatus = async (filterId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('message_filters')
        .update({ is_active: !currentStatus })
        .eq('id', filterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Filter ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredFilters = filters.filter(filter =>
    filter.filter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filter.filter_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filter.telegram_groups.chat_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Message Filters</h1>
            <p className="text-muted-foreground">
              Create rules to trigger workflows based on message content
            </p>
          </div>
        </div>

        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingFilter(null);
              setFormData({
                filter_name: "",
                filter_type: "keyword",
                filter_value: "",
                priority: 0,
                ai_prompt: "",
                group_id: "",
                workflow_id: ""
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFilter ? "Edit Filter" : "Create Message Filter"}
              </DialogTitle>
              <DialogDescription>
                Configure a filter to automatically trigger workflows when messages match your criteria.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filter_name">Filter Name *</Label>
                  <Input
                    id="filter_name"
                    placeholder="My Filter Rule"
                    value={formData.filter_name}
                    onChange={(e) => setFormData({ ...formData, filter_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="group_id">Telegram Group *</Label>
                  <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.chat_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workflow_id">Target Workflow *</Label>
                  <Select value={formData.workflow_id} onValueChange={(value) => setFormData({ ...formData, workflow_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-muted-foreground">Higher numbers = higher priority</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="filter_type">Filter Type *</Label>
                  <Select value={formData.filter_type} onValueChange={(value) => setFormData({ ...formData, filter_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filterTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter_value">
                    {formData.filter_type === 'keyword' && 'Keyword *'}
                    {formData.filter_type === 'regex' && 'Regex Pattern *'}
                    {formData.filter_type === 'message_type' && 'Message Type *'}
                    {formData.filter_type === 'ai_classification' && 'Classification Label *'}
                  </Label>
                  {formData.filter_type === 'message_type' ? (
                    <Select value={formData.filter_value} onValueChange={(value) => setFormData({ ...formData, filter_value: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select message type" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="filter_value"
                      placeholder={
                        formData.filter_type === 'keyword' ? 'help' :
                        formData.filter_type === 'regex' ? '\\b(urgent|emergency)\\b' :
                        formData.filter_type === 'ai_classification' ? 'support_request' : ''
                      }
                      value={formData.filter_value}
                      onChange={(e) => setFormData({ ...formData, filter_value: e.target.value })}
                    />
                  )}
                </div>

                {formData.filter_type === 'ai_classification' && (
                  <div>
                    <Label htmlFor="ai_prompt">AI Prompt</Label>
                    <Textarea
                      id="ai_prompt"
                      placeholder="Classify this message as a support request if it contains questions about..."
                      value={formData.ai_prompt}
                      onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">Optional: Custom prompt for AI classification</p>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <Button onClick={handleSubmit} className="w-full">
                  {editingFilter ? "Update Filter" : "Create Filter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Filters</CardTitle>
              <CardDescription>
                {filters.length} filter{filters.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No filters found</p>
                        {searchTerm && (
                          <Button variant="outline" onClick={() => setSearchTerm("")}>
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFilters.map((filter) => (
                    <TableRow key={filter.id}>
                      <TableCell className="font-medium">{filter.filter_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {filter.filter_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {filter.filter_value}
                      </TableCell>
                      <TableCell>{filter.telegram_groups.chat_title}</TableCell>
                      <TableCell>{filter.n8n_workflows.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{filter.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={filter.is_active ? "default" : "secondary"}>
                          {filter.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(filter)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFilterStatus(filter.id, filter.is_active)}
                          >
                            {filter.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(filter.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Filters;