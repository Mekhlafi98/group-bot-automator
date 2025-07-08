import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Filter, MessageSquare, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface MessageFilter {
  _id: string;
  groupId: string[];
  workflowId: string;
  filterName: string;
  filterType: string;
  filterValue: string;
  isActive: boolean;
  priority: number;
  aiPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TelegramGroup {
  _id: string;
  chatId: string;
  title: string;
  isActive: boolean;
}

interface Workflow {
  _id: string;
  name: string;
  workflowId: string;
  description: string;
  isActive: boolean;
}

const Filters = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MessageFilter | null>(null);
  const [formData, setFormData] = useState({
    groupId: [] as string[],
    workflowId: "",
    filterName: "",
    filterType: "keyword",
    filterValue: "",
    priority: 0,
    aiPrompt: "",
    isActive: true
  });
  const [openGroupPopover, setOpenGroupPopover] = useState(false);
  const [openEditGroupPopover, setOpenEditGroupPopover] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch filters
  const { data: filters = [], isLoading, error } = useQuery({
    queryKey: ['message-filters'],
    queryFn: async (): Promise<MessageFilter[]> => {
      const response = await api.get('/message-filters');
      return response.data;
    }
  });

  // Fetch groups for autocomplete
  const { data: groups = [], error: groupsError, isLoading: groupsLoading } = useQuery({
    queryKey: ['telegram-groups'],
    queryFn: async (): Promise<TelegramGroup[]> => {
      const response = await api.get('/telegram-groups');
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching groups:', error);
    }
  });

  // Fetch workflows for autocomplete
  const { data: workflows = [], isLoading: workflowsLoading, error: workflowsError } = useQuery({
    queryKey: ['workflows'],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await api.get('/workflows');
      return response.data;
    }
  });

  // Filter filters based on active status and search query
  const filteredFilters = (showActiveOnly ? filters.filter(filter => filter.isActive) : filters)
    .filter(filter =>
      searchQuery === "" ||
      filter.filterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filter.filterType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filter.filterValue.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Create filter mutation
  const createFilterMutation = useMutation({
    mutationFn: async (data: Omit<MessageFilter, '_id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post('/message-filters', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setIsCreateDialogOpen(false);
      setFormData({ groupId: [], workflowId: "", filterName: "", filterType: "keyword", filterValue: "", priority: 0, aiPrompt: "", isActive: true });
      toast({
        title: "Success",
        description: "Filter created successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create filter",
        variant: "destructive"
      });
    }
  });

  // Update filter mutation
  const updateFilterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MessageFilter> }) => {
      const response = await api.put(`/message-filters/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setEditingFilter(null);
      setFormData({ groupId: [], workflowId: "", filterName: "", filterType: "keyword", filterValue: "", priority: 0, aiPrompt: "", isActive: true });
      toast({
        title: "Success",
        description: "Filter updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update filter",
        variant: "destructive"
      });
    }
  });

  // Delete filter mutation
  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/message-filters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      toast({
        title: "Success",
        description: "Filter deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete filter",
        variant: "destructive"
      });
    }
  });

  // Toggle filter status mutation
  const toggleFilterMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.put(`/message-filters/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      toast({
        title: "Success",
        description: "Filter status updated",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update filter status",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFilter) {
      updateFilterMutation.mutate({ id: editingFilter._id, data: formData });
    } else {
      createFilterMutation.mutate({
        ...formData,
        priority: parseInt(formData.priority.toString()) || 0
      });
    }
  };

  const handleEdit = (filter: MessageFilter) => {
    setEditingFilter(filter);
    setFormData({
      groupId: filter.groupId,
      workflowId: filter.workflowId,
      filterName: filter.filterName,
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      priority: filter.priority,
      aiPrompt: filter.aiPrompt || "",
      isActive: filter.isActive
    });
  };

  const handleDelete = (id: string) => {
    deleteFilterMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleFilterMutation.mutate({ id, isActive: !currentStatus });
  };

  const getFilterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      keyword: "Keyword",
      regex: "Regex",
      sender_role: "Sender Role",
      message_type: "Message Type",
      ai_classification: "AI Classification"
    };
    return labels[type] || type;
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
          <p className="text-red-600 mb-2">Failed to load filters</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Filters</h1>
          <p className="text-muted-foreground">
            Manage message filtering rules for your bot
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
              Add Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Message Filter</DialogTitle>
              <DialogDescription>
                Configure a new message filter for automated processing
              </DialogDescription>
            </DialogHeader>

            {/* Show errors if groups or workflows failed to load */}
            {(groupsError || workflowsError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-800 text-sm font-medium">Data Loading Issues:</p>
                {groupsError && (
                  <p className="text-red-700 text-sm mt-1">• Failed to load groups</p>
                )}
                {workflowsError && (
                  <p className="text-red-700 text-sm mt-1">• Failed to load workflows</p>
                )}
                <p className="text-red-600 text-xs mt-2">Please refresh the page or check your connection.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="groupId">Groups</Label>
                <Popover open={openGroupPopover} onOpenChange={setOpenGroupPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openGroupPopover}
                      className="w-full justify-between"
                    >
                      {formData.groupId.length > 0
                        ? `${formData.groupId.length} group(s) selected`
                        : "Select groups..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search groups..." />
                      <CommandList>
                        <CommandEmpty>No groups found.</CommandEmpty>
                        <CommandGroup>
                          {groups.map((group) => (
                            <CommandItem
                              key={group._id}
                              value={group.title}
                              onSelect={() => {
                                const isSelected = formData.groupId.includes(group._id);
                                const newGroupIds = isSelected
                                  ? formData.groupId.filter(id => id !== group._id)
                                  : [...formData.groupId, group._id];
                                setFormData({ ...formData, groupId: newGroupIds });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.groupId.includes(group._id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {group.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.groupId.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.groupId.map((groupId) => {
                      const group = groups.find(g => g._id === groupId);
                      return group ? (
                        <Badge key={groupId} variant="secondary" className="text-xs">
                          {group.title}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                groupId: formData.groupId.filter(id => id !== groupId)
                              });
                            }}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="workflowId">Workflow ID</Label>
                <Select
                  id="workflowId"
                  value={formData.workflowId}
                  onValueChange={(value) => setFormData({ ...formData, workflowId: value })}
                  placeholder="Select a workflow"
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow._id} value={workflow._id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterName">Filter Name</Label>
                <Input
                  id="filterName"
                  value={formData.filterName}
                  onChange={(e) => setFormData({ ...formData, filterName: e.target.value })}
                  placeholder="e.g., Spam Filter"
                  required
                />
              </div>
              <div>
                <Label htmlFor="filterType">Filter Type</Label>
                <select
                  id="filterType"
                  value={formData.filterType}
                  onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                  <option value="sender_role">Sender Role</option>
                  <option value="message_type">Message Type</option>
                  <option value="ai_classification">AI Classification</option>
                </select>
              </div>
              <div>
                <Label htmlFor="filterValue">Filter Value</Label>
                <Input
                  id="filterValue"
                  value={formData.filterValue}
                  onChange={(e) => setFormData({ ...formData, filterValue: e.target.value })}
                  placeholder="e.g., spam, advertisement"
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="aiPrompt">AI Prompt (Optional)</Label>
                <Input
                  id="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                  placeholder="AI prompt for classification"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFilterMutation.isPending}>
                  {createFilterMutation.isPending ? "Creating..." : "Create Filter"}
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
            placeholder="Search filters by name, type, or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFilters.map((filter) => (
          <Card key={filter._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{filter.filterName}</CardTitle>
                <Badge variant={filter.isActive ? "default" : "secondary"}>
                  {filter.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                {getFilterTypeLabel(filter.filterType)}: "{filter.filterValue}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getFilterTypeLabel(filter.filterType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{filter.filterValue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Workflow: </span>
                  {(() => {
                    const workflow = workflows.find(w => w._id === filter.workflowId);
                    return workflow ? (
                      <Badge variant="outline" className="text-xs">
                        {workflow.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unknown Workflow</span>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Priority: {filter.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Groups: </span>
                  <div className="flex flex-wrap gap-1">
                    {filter.groupId.length > 0 ? (
                      filter.groupId.map((groupId) => {
                        const group = groups.find(g => g._id === groupId);
                        return group ? (
                          <Badge key={groupId} variant="outline" className="text-xs">
                            {group.title}
                          </Badge>
                        ) : (
                          <Badge key={groupId} variant="outline" className="text-xs text-muted-foreground">
                            Unknown Group
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">No groups assigned</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(filter._id, filter.isActive)}
                    disabled={toggleFilterMutation.isPending}
                  >
                    {filter.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {filter.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(filter)}
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
                        <AlertDialogTitle>Delete Filter</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{filter.filterName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(filter._id)}
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
      <Dialog open={!!editingFilter} onOpenChange={() => setEditingFilter(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Filter</DialogTitle>
            <DialogDescription>
              Update the filter information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-groupId">Groups</Label>
              <Popover open={openEditGroupPopover} onOpenChange={setOpenEditGroupPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEditGroupPopover}
                    className="w-full justify-between"
                  >
                    {formData.groupId.length > 0
                      ? `${formData.groupId.length} group(s) selected`
                      : "Select groups..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search groups..." />
                    <CommandList>
                      <CommandEmpty>No groups found.</CommandEmpty>
                      <CommandGroup>
                        {groups.map((group) => (
                          <CommandItem
                            key={group._id}
                            value={group.title}
                            onSelect={() => {
                              const isSelected = formData.groupId.includes(group._id);
                              const newGroupIds = isSelected
                                ? formData.groupId.filter(id => id !== group._id)
                                : [...formData.groupId, group._id];
                              setFormData({ ...formData, groupId: newGroupIds });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.groupId.includes(group._id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {group.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.groupId.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.groupId.map((groupId) => {
                    const group = groups.find(g => g._id === groupId);
                    return group ? (
                      <Badge key={groupId} variant="secondary" className="text-xs">
                        {group.title}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              groupId: formData.groupId.filter(id => id !== groupId)
                            });
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-workflowId">Workflow ID</Label>
              <Select
                id="edit-workflowId"
                value={formData.workflowId}
                onValueChange={(value) => setFormData({ ...formData, workflowId: value })}
                placeholder="Select a workflow"
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-filterName">Filter Name</Label>
              <Input
                id="edit-filterName"
                value={formData.filterName}
                onChange={(e) => setFormData({ ...formData, filterName: e.target.value })}
                placeholder="e.g., Spam Filter"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-filterType">Filter Type</Label>
              <select
                id="edit-filterType"
                value={formData.filterType}
                onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="keyword">Keyword</option>
                <option value="regex">Regex</option>
                <option value="sender_role">Sender Role</option>
                <option value="message_type">Message Type</option>
                <option value="ai_classification">AI Classification</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-filterValue">Filter Value</Label>
              <Input
                id="edit-filterValue"
                value={formData.filterValue}
                onChange={(e) => setFormData({ ...formData, filterValue: e.target.value })}
                placeholder="e.g., spam, advertisement"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Input
                id="edit-priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="edit-aiPrompt">AI Prompt (Optional)</Label>
              <Input
                id="edit-aiPrompt"
                value={formData.aiPrompt}
                onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                placeholder="AI prompt for classification"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingFilter(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFilterMutation.isPending}>
                {updateFilterMutation.isPending ? "Updating..." : "Update Filter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Filters;