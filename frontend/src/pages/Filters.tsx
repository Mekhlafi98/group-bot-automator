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
import { Plus, Edit, Trash2, Filter, MessageSquare, ToggleLeft, ToggleRight, Search, MoreHorizontal, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MessageFilter {
  _id: string;
  groupId: string[];
  workflowId?: string;
  channelId: string;
  filterName: string;
  filterType: string;
  filterValue: string;
  isActive: boolean;
  priority: number;
  aiPrompt?: string;
  support?: Support[] | string[];
  createdAt: string;
  updatedAt: string;
}

interface Support {
  _id: string;
  name: string;
  number: string;
  isActive: boolean;
  isBlocked: boolean;
  notes?: string;
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

interface Channel {
  _id: string;
  phone: string;
  type: string;
  status: string;
}

const Filters = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MessageFilter | null>(null);
  const [formData, setFormData] = useState<{
    groupId: string[];
    workflowId: string;
    channelId: string;
    filterName: string;
    filterType: string;
    filterValue: string;
    priority: number;
    aiPrompt: string;
    isActive: boolean;
    support: string[];
  }>({
    groupId: [],
    workflowId: "",
    channelId: "",
    filterName: "",
    filterType: "keyword",
    filterValue: "",
    priority: 0,
    aiPrompt: "",
    isActive: true,
    support: [],
  });
  const [openGroupPopover, setOpenGroupPopover] = useState(false);
  const [openEditGroupPopover, setOpenEditGroupPopover] = useState(false);
  const [openSupportPopover, setOpenSupportPopover] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch filters
  const { data: filters = [], isLoading, error } = useQuery({
    queryKey: ['message-filters'],
    queryFn: async (): Promise<MessageFilter[]> => {
      const response = await api.get('/message-filters');
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // Fetch groups for autocomplete
  const { data: groups = [], error: groupsError, isLoading: groupsLoading } = useQuery<TelegramGroup[], Error>({
    queryKey: ['telegram-groups'],
    queryFn: async () => {
      const response = await api.get('/telegram-groups');
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // Fetch workflows for autocomplete
  const { data: workflows = [], isLoading: workflowsLoading, error: workflowsError } = useQuery({
    queryKey: ['workflows'],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await api.get('/workflows');
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // Fetch support for autocomplete
  const { data: supportList = [], error: supportError, isLoading: supportLoading } = useQuery<Support[], Error>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get('/contacts');
      const data = Array.isArray(response.data) ? response.data : (response.data?.contacts || []);
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch channels for autocomplete
  const { data: channels = [], error: channelsError, isLoading: channelsLoading } = useQuery<Channel[], Error>({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await api.get('/channels');
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // Ensure all data arrays are properly initialized
  const safeFilters = Array.isArray(filters) ? filters : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeWorkflows = Array.isArray(workflows) ? workflows : [];
  const safeSupportList = Array.isArray(supportList) ? supportList : [];
  const safeChannels = Array.isArray(channels) ? channels : [];

  // Filter filters based on active status and search query
  const filteredFilters = (showActiveOnly ? safeFilters.filter(filter => filter.isActive) : safeFilters)
    .filter(filter =>
      searchQuery === "" ||
      filter.filterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filter.filterType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filter.filterValue.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFilters(filteredFilters.map(filter => filter._id));
    } else {
      setSelectedFilters([]);
    }
  };

  const handleSelectFilter = (filterId: string, checked: boolean) => {
    if (checked) {
      setSelectedFilters(prev => [...prev, filterId]);
    } else {
      setSelectedFilters(prev => prev.filter(id => id !== filterId));
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedFilters.length === 0) return;

    try {
      await Promise.all(selectedFilters.map(id => api.delete(`/message-filters/${id}`)));
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setSelectedFilters([]);
      toast({
        title: "Success",
        description: `${selectedFilters.length} filter(s) deleted successfully`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete filters",
        variant: "destructive"
      });
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedFilters.length === 0) return;

    try {
      await Promise.all(selectedFilters.map(id =>
        api.put(`/message-filters/${id}`, { isActive })
      ));
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setSelectedFilters([]);
      toast({
        title: "Success",
        description: `${selectedFilters.length} filter(s) ${isActive ? 'activated' : 'deactivated'} successfully`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update filters",
        variant: "destructive"
      });
    }
  };

  const handleBulkExport = () => {
    if (selectedFilters.length === 0) return;

    const selectedFilterData = filteredFilters.filter(filter =>
      selectedFilters.includes(filter._id)
    );

    const csvContent = [
      ['Filter Name', 'Type', 'Value', 'Priority', 'Status', 'Groups', 'Workflow', 'Channel', 'Created At'],
      ...selectedFilterData.map(filter => [
        filter.filterName,
        filter.filterType,
        filter.filterValue,
        filter.priority,
        filter.isActive ? 'Active' : 'Inactive',
        filter.groupId.length,
        safeWorkflows.find(w => w._id === filter.workflowId)?.name || 'Unknown',
        safeChannels.find(c => c._id === filter.channelId)?.phone || 'None',
        new Date(filter.createdAt).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filters-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `${selectedFilters.length} filter(s) exported successfully`,
      variant: "default"
    });
  };

  // Create filter mutation
  const createFilterMutation = useMutation({
    mutationFn: async (data: Omit<MessageFilter, '_id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post('/message-filters', {
        ...data,
        support: data.support || [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setIsCreateDialogOpen(false);
      setFormData({ groupId: [], workflowId: "", channelId: "", filterName: "", filterType: "keyword", filterValue: "", priority: 0, aiPrompt: "", isActive: true, support: [] });
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
      const response = await api.put(`/message-filters/${id}`, {
        ...data,
        support: data.support || [],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
      setEditingFilter(null);
      setFormData({ groupId: [], workflowId: "", channelId: "", filterName: "", filterType: "keyword", filterValue: "", priority: 0, aiPrompt: "", isActive: true, support: [] });
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

    // Validation for required fields
    if (!formData.channelId) {
      toast({
        title: 'Error',
        description: 'Channel ID is required',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.filterName.trim()) {
      toast({
        title: 'Error',
        description: 'Filter Name is required',
        variant: 'destructive'
      });
      return;
    }


    if (!formData.filterValue.trim()) {
      toast({
        title: 'Error',
        description: 'Filter Value is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.support.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one support contact is required',
        variant: 'destructive'
      });
      return;
    }

    // Clean the data to handle optional fields properly
    const cleanData = {
      ...formData,
      priority: 0, // Default priority since field is hidden
      support: formData.support,
      // Convert empty strings to null for optional ObjectId fields
      workflowId: formData.workflowId || null,
      groupId: formData.groupId.length > 0 ? formData.groupId : [],
    };

    if (editingFilter) {
      updateFilterMutation.mutate({ id: editingFilter._id, data: cleanData });
    } else {
      createFilterMutation.mutate(cleanData);
    }
  };

  const handleEdit = (filter: MessageFilter) => {
    setEditingFilter(filter);
    setFormData({
      groupId: filter.groupId,
      workflowId: filter.workflowId,
      channelId: filter.channelId || "",
      filterName: filter.filterName,
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      priority: filter.priority,
      aiPrompt: filter.aiPrompt || "",
      isActive: filter.isActive,
      support: Array.isArray(filter.support)
        ? (filter.support as (string | { _id: string })[]).map(s => typeof s === 'string' ? s : s._id)
        : [],
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
                <Label htmlFor="channelId">Channel ID</Label>
                <Select
                  value={formData.channelId}
                  onValueChange={(value) => setFormData({ ...formData, channelId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeChannels.map((channel) => (
                      <SelectItem key={channel._id} value={channel._id}>
                        {channel.phone} ({channel.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="groupId">Groups (Optional)</Label>
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
                          {safeGroups.map((group) => (
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
                      const group = safeGroups.find(g => g._id === groupId);
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
                <Label htmlFor="workflowId">Workflow ID (Optional)</Label>
                <Select
                  value={formData.workflowId}
                  onValueChange={(value) => setFormData({ ...formData, workflowId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeWorkflows.map((workflow) => (
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
                <Label htmlFor="aiPrompt">AI Prompt (Optional)</Label>
                <Input
                  id="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                  placeholder="AI prompt for classification"
                />
              </div>
              <div>
                <Label htmlFor="support">Support</Label>
                <Popover open={openSupportPopover} onOpenChange={setOpenSupportPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSupportPopover}
                      className="w-full justify-between"
                    >
                      {formData.support.length > 0
                        ? `${formData.support.length} support contact(s) selected`
                        : "Select support contacts..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search support..." />
                      <CommandList>
                        <CommandEmpty>No support found.</CommandEmpty>
                        <CommandGroup>
                          {safeSupportList.map((support) => (
                            <CommandItem
                              key={support._id}
                              value={support.name}
                              onSelect={() => {
                                const isSelected = formData.support.includes(support._id);
                                const newSupportIds = isSelected
                                  ? formData.support.filter(id => id !== support._id)
                                  : [...formData.support, support._id];
                                setFormData({ ...formData, support: newSupportIds });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.support.includes(support._id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {support.name} ({support.number})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.support.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.support.map((supportId) => {
                      const support = safeSupportList.find(c => c._id === supportId);
                      return support ? (
                        <Badge key={supportId} variant="secondary" className="text-xs">
                          {support.name} ({support.number})
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                support: formData.support.filter(id => id !== supportId)
                              });
                            }}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
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

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search filters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showActiveOnly"
              checked={showActiveOnly}
              onCheckedChange={(checked) => setShowActiveOnly(checked as boolean)}
            />
            <Label htmlFor="showActiveOnly" className="text-sm">
              Show Active Only
            </Label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFilters.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedFilters.length} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBulkExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkToggleStatus(true)}>
                  <ToggleLeft className="mr-2 h-4 w-4" />
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkToggleStatus(false)}>
                  <ToggleRight className="mr-2 h-4 w-4" />
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleBulkDelete}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFilters.length === filteredFilters.length && filteredFilters.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Filter Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFilters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No filters found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFilters.map((filter) => (
                  <TableRow key={filter._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFilters.includes(filter._id)}
                        onCheckedChange={(checked) => handleSelectFilter(filter._id, checked as boolean)}
                        aria-label={`Select ${filter.filterName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{filter.filterName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getFilterTypeLabel(filter.filterType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {filter.filterValue}
                    </TableCell>
                    <TableCell>
                      <Badge variant={filter.isActive ? "default" : "secondary"}>
                        {filter.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {filter.groupId.length > 0 ? (
                          filter.groupId.slice(0, 2).map((groupId) => {
                            const group = safeGroups.find(g => g._id === groupId);
                            return group ? (
                              <Badge key={groupId} variant="outline" className="text-xs">
                                {group.title}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        {filter.groupId.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{filter.groupId.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {filter.channelId ? (
                        (() => {
                          const channel = safeChannels.find(c => c._id === filter.channelId);
                          return channel ? (
                            <span className="text-sm font-mono">{channel.phone}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unknown</span>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(filter.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(filter)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(filter._id, filter.isActive)}>
                            {filter.isActive ? (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(filter._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingFilter} onOpenChange={() => setEditingFilter(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Filter</DialogTitle>
            <DialogDescription>
              Update the filter information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-channelId">Channel ID</Label>
              <Select
                value={formData.channelId}
                onValueChange={(value) => setFormData({ ...formData, channelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {safeChannels.map((channel) => (
                    <SelectItem key={channel._id} value={channel._id}>
                      {channel.phone} ({channel.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-groupId">Groups (Optional)</Label>
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
                        {safeGroups.map((group) => (
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
                    const group = safeGroups.find(g => g._id === groupId);
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
              <Label htmlFor="edit-workflowId">Workflow ID (Optional)</Label>
              <Select
                value={formData.workflowId}
                onValueChange={(value) => setFormData({ ...formData, workflowId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workflow" />
                </SelectTrigger>
                <SelectContent>
                  {safeWorkflows.map((workflow) => (
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
              <Label htmlFor="edit-aiPrompt">AI Prompt (Optional)</Label>
              <Input
                id="edit-aiPrompt"
                value={formData.aiPrompt}
                onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                placeholder="AI prompt for classification"
              />
            </div>
            <div>
              <Label htmlFor="edit-support">Support</Label>
              <Popover open={openSupportPopover} onOpenChange={setOpenSupportPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupportPopover}
                    className="w-full justify-between"
                  >
                    {formData.support.length > 0
                      ? `${formData.support.length} support contact(s) selected`
                      : "Select support contacts..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search support..." />
                    <CommandList>
                      <CommandEmpty>No support found.</CommandEmpty>
                      <CommandGroup>
                        {safeSupportList.map((support) => (
                          <CommandItem
                            key={support._id}
                            value={support.name}
                            onSelect={() => {
                              const isSelected = formData.support.includes(support._id);
                              const newSupportIds = isSelected
                                ? formData.support.filter(id => id !== support._id)
                                : [...formData.support, support._id];
                              setFormData({ ...formData, support: newSupportIds });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.support.includes(support._id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {support.name} ({support.number})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.support.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.support.map((supportId) => {
                    const support = safeSupportList.find(c => c._id === supportId);
                    return support ? (
                      <Badge key={supportId} variant="secondary" className="text-xs">
                        {support.name} ({support.number})
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              support: formData.support.filter(id => id !== supportId)
                            });
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
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
    </div >
  );
};

export default Filters;