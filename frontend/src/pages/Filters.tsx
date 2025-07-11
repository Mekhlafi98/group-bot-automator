import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, MoreHorizontal, Download, ToggleLeft, ToggleRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Papa from 'papaparse';
import ExcelJS from 'exceljs'; // Replaced import

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

const DEFAULT_FILTER_VALUES = {
  groupId: [],
  workflowId: "",
  channelId: "",
  filterType: "keyword",
  filterValue: "",
  priority: 0,
  aiPrompt: "",
  isActive: true,
  support: [],
};

const FILTER_TYPE_OPTIONS = [
  { value: "keyword", label: "Keyword" },
  { value: "regex", label: "Regex" },
  { value: "sender_role", label: "Sender Role" },
  { value: "message_type", label: "Message Type" },
  { value: "ai_classification", label: "AI Classification" },
];

const Filters = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<MessageFilter | null>(null);
  const [formData, setFormData] = useState<{
    groupId: string[];
    workflowId: string;
    channelId: string;
    filterType: string;
    filterValue: string;
    priority: number;
    aiPrompt: string;
    isActive: boolean;
    support: string[];
  }>(DEFAULT_FILTER_VALUES);
  const [openGroupPopover, setOpenGroupPopover] = useState(false);
  const [openSupportPopover, setOpenSupportPopover] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

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
  const { data: supportListRaw = [], error: supportError, isLoading: supportLoading } = useQuery<any, Error>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get('/contacts');
      let data = response.data;
      // Try to extract contacts array from various possible structures
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.contacts)) {
        return data.contacts;
      } else if (data && data.data && Array.isArray(data.data.contacts)) {
        return data.data.contacts;
      } else {
        console.warn('No contacts found in /contacts API response:', data);
        return [];
      }
    }
  });
  const safeSupportList: Support[] = Array.isArray(supportListRaw) ? supportListRaw : [];

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

  // Enhanced export functionality
  const handleBulkExport = async (format: 'csv' | 'json' | 'xlsx' = 'csv') => {
    if (selectedFilters.length === 0) return;

    const selectedFilterData = filteredFilters.filter(filter =>
      selectedFilters.includes(filter._id)
    );

    const exportData = selectedFilterData.map(filter => ({
      filterName: filter.filterName,
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      priority: filter.priority,
      status: filter.isActive ? 'Active' : 'Inactive',
      groups: filter.groupId.map(groupId => {
        const group = safeGroups.find(g => g._id === groupId);
        return group ? group.title : 'Unknown';
      }).join('; '),
      workflow: safeWorkflows.find(w => w._id === filter.workflowId)?.name || 'None',
      channel: safeChannels.find(c => c._id === filter.channelId)?.phone || 'None',
      support: Array.isArray(filter.support)
        ? filter.support.map(supportId => {
          const support = safeSupportList.find(s => s._id === supportId);
          return support ? `${support.name} (${support.number})` : 'Unknown';
        }).join('; ')
        : 'None',
      aiPrompt: filter.aiPrompt || 'None',
      createdAt: new Date(filter.createdAt).toISOString(),
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filters-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Filters');

      // Add headers
      worksheet.columns = [
        { header: 'Filter Name', key: 'filterName', width: 20 },
        { header: 'Type', key: 'filterType', width: 15 },
        { header: 'Value', key: 'filterValue', width: 30 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Groups', key: 'groups', width: 30 },
        { header: 'Workflow', key: 'workflow', width: 20 },
        { header: 'Channel', key: 'channel', width: 20 },
        { header: 'Support', key: 'support', width: 30 },
        { header: 'AI Prompt', key: 'aiPrompt', width: 30 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ];

      // Add data
      worksheet.addRows(exportData);

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filters-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Default to CSV
      const csvContent = Papa.unparse(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filters-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    toast({
      title: "Success",
      description: `${selectedFilters.length} filter(s) exported as ${format.toUpperCase()}`,
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
      setFormData(DEFAULT_FILTER_VALUES);
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
      setFormData(DEFAULT_FILTER_VALUES);
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

    // Enhanced validation
    const errors = [];
    if (!formData.channelId) errors.push('Channel is required');
    if (!formData.filterValue.trim()) errors.push('Filter value is required');
    if (formData.support.length === 0) errors.push('At least one support contact is required');
    if (formData.filterType === 'regex' && !isValidRegex(formData.filterValue)) {
      errors.push('Invalid regular expression');
    }

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join('\n'),
        variant: 'destructive'
      });
      return;
    }

    // Clean the data
    const cleanData = {
      ...formData,
      groupId: Array.isArray(formData.groupId)
        ? formData.groupId.map(g => (typeof g === 'string' ? g : g._id))
        : [],
      workflowId: formData.workflowId && typeof formData.workflowId === 'object'
        ? (formData.workflowId as any)._id
        : formData.workflowId || null,
      channelId: formData.channelId && typeof formData.channelId === 'object'
        ? (formData.channelId as any)._id
        : formData.channelId || '',
      support: Array.isArray(formData.support)
        ? (formData.support as (string | { _id: string })[]).map(s => typeof s === 'string' ? s : s._id)
        : [],
      priority: formData.priority || 0,
      filterName: formData.filterValue.slice(0, 50) || `Filter-${Date.now()}`,
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
      groupId: Array.isArray(filter.groupId)
        ? filter.groupId.map(g => (typeof g === 'string' ? g : g._id))
        : [],
      workflowId: filter.workflowId && typeof filter.workflowId === 'object'
        ? (filter.workflowId as any)._id
        : filter.workflowId || '',
      channelId: filter.channelId && typeof filter.channelId === 'object'
        ? (filter.channelId as any)._id
        : filter.channelId || '',
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      priority: filter.priority,
      aiPrompt: filter.aiPrompt || '',
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
    const option = FILTER_TYPE_OPTIONS.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  // Regex validation helper
  const isValidRegex = (pattern: string) => {
    try {
      new RegExp(pattern);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Enhanced import functionality
  const handleImportClick = () => {
    if (importInputRef.current) {
      importInputRef.current.value = "";
      importInputRef.current.click();
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      let filters: any[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'json') {
        const text = await file.text();
        filters = JSON.parse(text);
      } else if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true });
        filters = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const firstSheet = workbook.worksheets[0];
        filters = firstSheet.getSheetValues().slice(1).map((row: any) => {
          const obj: any = {};
          firstSheet.columns?.forEach((col, index) => {
            if (col.key) {
              obj[col.key] = row[index + 1]; // ExcelJS row data is 1-indexed for columns
            }
          });
          return obj;
        });
      } else {
        throw new Error('Unsupported file type. Please use CSV, JSON, or Excel.');
      }

      // Normalize and validate imported data
      const normalizedFilters = filters.map(filter => {
        // Map column names to our expected format
        const normalized: any = {};

        // Handle different possible column names
        normalized.filterType = filter.filterType || filter.type || 'keyword';
        normalized.filterValue = filter.filterValue || filter.value || filter.pattern || '';
        normalized.priority = parseInt(filter.priority || filter.order || '0', 10) || 0;
        normalized.isActive = filter.isActive !== undefined ? Boolean(filter.isActive) : true;
        normalized.aiPrompt = filter.aiPrompt || filter.prompt || '';

        // Handle groups - can be string with delimiters or array
        if (Array.isArray(filter.groupId)) {
          normalized.groupId = filter.groupId;
        } else if (typeof filter.groupId === 'string') {
          normalized.groupId = filter.groupId.split(/[;,|]/).map((g: string) => g.trim()).filter(Boolean);
        } else {
          normalized.groupId = [];
        }

        // Handle support contacts
        if (Array.isArray(filter.support)) {
          normalized.support = filter.support;
        } else if (typeof filter.support === 'string') {
          normalized.support = filter.support.split(/[;,|]/).map((s: string) => s.trim()).filter(Boolean);
        } else {
          normalized.support = [];
        }

        // Find channel by phone number if ID not provided
        if (filter.channelId) {
          normalized.channelId = filter.channelId;
        } else if (filter.channelPhone) {
          const channel = safeChannels.find(c => c.phone === filter.channelPhone);
          if (channel) normalized.channelId = channel._id;
        }

        // Find workflow by name if ID not provided
        if (filter.workflowId) {
          normalized.workflowId = filter.workflowId;
        } else if (filter.workflowName) {
          const workflow = safeWorkflows.find(w => w.name === filter.workflowName);
          if (workflow) normalized.workflowId = workflow._id;
        }

        return normalized;
      });

      // Import each filter with error handling
      let successCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];

      for (const filter of normalizedFilters) {
        try {
          // Skip empty or invalid entries
          if (!filter.filterValue || !filter.channelId) {
            errorCount++;
            continue;
          }

          // Create the filter
          await createFilterMutation.mutateAsync({
            ...DEFAULT_FILTER_VALUES,
            ...filter,
            filterName: filter.filterName || `Imported-${filter.filterType}-${Date.now()}`,
          });
          successCount++;
        } catch (err: any) {
          errorCount++;
          errorMessages.push(`Failed to import filter "${filter.filterValue}": ${err.message}`);
        }
      }

      // Show results
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} filters, ${errorCount} failed.`,
        variant: errorCount === 0 ? 'default' : 'destructive',
      });

      // Show detailed errors if any
      if (errorMessages.length > 0) {
        console.error('Import errors:', errorMessages);
      }

      queryClient.invalidateQueries({ queryKey: ['message-filters'] });
    } catch (err: any) {
      toast({
        title: 'Import Error',
        description: err.message || 'Failed to import filters',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  // Export template for users to download
  const handleExportTemplate = async () => {
    const template = [{
      filterName: "Example Filter",
      filterType: "keyword",
      filterValue: "spam",
      channelId: safeChannels[0]?._id || "channel-id-here",
      channelPhone: safeChannels[0]?.phone || "1234567890",
      workflowId: safeWorkflows[0]?._id || "workflow-id-here",
      workflowName: safeWorkflows[0]?.name || "Workflow Name",
      groupId: safeGroups[0]?._id || "group-id-here",
      support: safeSupportList[0]?._id || "support-id-here",
      priority: 0,
      isActive: true,
      aiPrompt: "Classify this message as spam",
    }];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Filter Template');

    worksheet.columns = [
      { header: 'filterName', key: 'filterName', width: 20 },
      { header: 'filterType', key: 'filterType', width: 15 },
      { header: 'filterValue', key: 'filterValue', width: 30 },
      { header: 'channelId', key: 'channelId', width: 30 },
      { header: 'channelPhone', key: 'channelPhone', width: 20 },
      { header: 'workflowId', key: 'workflowId', width: 30 },
      { header: 'workflowName', key: 'workflowName', width: 20 },
      { header: 'groupId', key: 'groupId', width: 30 },
      { header: 'support', key: 'support', width: 30 },
      { header: 'priority', key: 'priority', width: 10 },
      { header: 'isActive', key: 'isActive', width: 10 },
      { header: 'aiPrompt', key: 'aiPrompt', width: 30 },
    ];
    worksheet.addRows(template);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filters-import-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Please fill out the template and import it",
      variant: "default"
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
        <div className="flex gap-2">
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
                  <Label htmlFor="channelId">Channel *</Label>
                  <Select
                    value={formData.channelId}
                    onValueChange={(value) => setFormData({ ...formData, channelId: value })}
                    required
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
                  <Label htmlFor="filterType">Filter Type</Label>
                  <Select
                    value={formData.filterType}
                    onValueChange={(value) => setFormData({ ...formData, filterType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterValue">Filter Value *</Label>
                  <Input
                    id="filterValue"
                    value={formData.filterValue}
                    onChange={(e) => setFormData({ ...formData, filterValue: e.target.value })}
                    placeholder="e.g., spam, advertisement"
                    required
                  />
                  {formData.filterType === 'regex' && !isValidRegex(formData.filterValue) && (
                    <p className="text-xs text-red-600 mt-1">Invalid regular expression</p>
                  )}
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
                  <Label htmlFor="support">Support Contacts *</Label>
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
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={importing}>
                {importing ? "Importing..." : "Import"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleImportClick}>
                Import Filters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportTemplate}>
                Download Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={importInputRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                      As CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                      As JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkExport('xlsx')}>
                      As Excel
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Support</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFilters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                          if (typeof filter.channelId === 'object' && filter.channelId !== null) {
                            return (
                              <span className="text-sm font-mono">{(filter.channelId as Channel).phone} ({(filter.channelId as Channel).type})</span>
                            );
                          }
                          const channel = safeChannels.find(c => c._id === filter.channelId);
                          return channel ? (
                            <span className="text-sm font-mono">{channel.phone} ({channel.type})</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unknown</span>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(filter.support) && filter.support.length > 0 ? (
                          filter.support.slice(0, 2).map((supportId) => {
                            const support = safeSupportList.find(s => s._id === supportId);
                            return support ? (
                              <Badge key={supportId} variant="outline" className="text-xs">
                                {support.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        {Array.isArray(filter.support) && filter.support.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{filter.support.length - 2}
                          </Badge>
                        )}
                      </div>
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
              <Label htmlFor="edit-channelId">Channel *</Label>
              <Select
                value={formData.channelId}
                onValueChange={(value) => setFormData({ ...formData, channelId: value })}
                required
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
              <Label htmlFor="edit-filterType">Filter Type</Label>
              <Select
                value={formData.filterType}
                onValueChange={(value) => setFormData({ ...formData, filterType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-filterValue">Filter Value *</Label>
              <Input
                id="edit-filterValue"
                value={formData.filterValue}
                onChange={(e) => setFormData({ ...formData, filterValue: e.target.value })}
                placeholder="e.g., spam, advertisement"
                required
              />
              {formData.filterType === 'regex' && !isValidRegex(formData.filterValue) && (
                <p className="text-xs text-red-600 mt-1">Invalid regular expression</p>
              )}
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
              <Label htmlFor="edit-support">Support Contacts *</Label>
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
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
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