import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, RefreshCw, AlertTriangle, Info, CheckCircle, Clock, Search, Filter, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface MessageLog {
  _id: string;
  workflow_id: string;
  workflow_name?: string;
  execution_id?: string;
  node_name?: string;
  error_message: string;
  error_stack?: string;
  input_data?: any;
  timestamp: string;
  status: 'error' | 'warning' | 'info' | 'success' | 'pending' | 'retrying';
  retries_count: number;
  triggered_by?: string;
  createdAt: string;
  updatedAt: string;
}

interface LogStats {
  statusBreakdown: Array<{ _id: string; count: number }>;
  totalLogs: number;
  recentLogs: number;
  topWorkflows: Array<{ _id: string; count: number; workflow_name?: string }>;
}

const Logs = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MessageLog | null>(null);
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    workflow_id: "all",
    node_name: "",
    startDate: "",
    endDate: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    workflow_id: "",
    workflow_name: "",
    execution_id: "",
    node_name: "",
    error_message: "",
    error_stack: "",
    input_data: "",
    status: "error" as const,
    retries_count: 0,
    triggered_by: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch logs with pagination and filters
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['message-logs', currentPage, filters],
    queryFn: async (): Promise<{ logs: MessageLog[]; pagination: any }> => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters
      });
      const response = await api.get(`/api/message-logs?${params}`);
      return response.data;
    }
  });

  // Fetch log statistics
  const { data: stats } = useQuery({
    queryKey: ['message-logs-stats'],
    queryFn: async (): Promise<LogStats> => {
      const response = await api.get('/api/message-logs/stats');
      return response.data;
    }
  });

  // Fetch workflows for filter dropdown
  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await api.get('/api/workflows');
      return response.data;
    }
  });

  // Create log mutation
  const createLogMutation = useMutation({
    mutationFn: async (data: Omit<MessageLog, '_id' | 'createdAt' | 'updatedAt' | 'timestamp'>) => {
      const response = await api.post('/api/message-logs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-logs'] });
      queryClient.invalidateQueries({ queryKey: ['message-logs-stats'] });
      setIsCreateDialogOpen(false);
      setFormData({
        workflow_id: "",
        workflow_name: "",
        execution_id: "",
        node_name: "",
        error_message: "",
        error_stack: "",
        input_data: "",
        status: "error",
        retries_count: 0,
        triggered_by: ""
      });
      toast({
        title: "Success",
        description: "Error log created successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create error log",
        variant: "destructive"
      });
    }
  });

  // Update log mutation
  const updateLogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MessageLog> }) => {
      const response = await api.put(`/api/message-logs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-logs'] });
      queryClient.invalidateQueries({ queryKey: ['message-logs-stats'] });
      setEditingLog(null);
      setFormData({
        workflow_id: "",
        workflow_name: "",
        execution_id: "",
        node_name: "",
        error_message: "",
        error_stack: "",
        input_data: "",
        status: "error",
        retries_count: 0,
        triggered_by: ""
      });
      toast({
        title: "Success",
        description: "Error log updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update error log",
        variant: "destructive"
      });
    }
  });

  // Delete log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/message-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-logs'] });
      queryClient.invalidateQueries({ queryKey: ['message-logs-stats'] });
      toast({
        title: "Success",
        description: "Error log deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete error log",
        variant: "destructive"
      });
    }
  });

  // Retry log mutation
  const retryLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/api/message-logs/${id}/retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-logs'] });
      queryClient.invalidateQueries({ queryKey: ['message-logs-stats'] });
      toast({
        title: "Success",
        description: "Error log retry initiated",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to retry error log",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      input_data: formData.input_data ? JSON.parse(formData.input_data) : undefined
    };

    if (editingLog) {
      updateLogMutation.mutate({ id: editingLog._id, data: submitData });
    } else {
      createLogMutation.mutate(submitData);
    }
  };

  const handleEdit = (log: MessageLog) => {
    setEditingLog(log);
    setFormData({
      workflow_id: log.workflow_id,
      workflow_name: log.workflow_name || "",
      execution_id: log.execution_id || "",
      node_name: log.node_name || "",
      error_message: log.error_message,
      error_stack: log.error_stack || "",
      input_data: log.input_data ? JSON.stringify(log.input_data, null, 2) : "",
      status: log.status,
      retries_count: log.retries_count,
      triggered_by: log.triggered_by || ""
    });
  };

  const handleDelete = (id: string) => {
    deleteLogMutation.mutate(id);
  };

  const handleRetry = (id: string) => {
    retryLogMutation.mutate(id);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      workflow_id: "all",
      node_name: "",
      startDate: "",
      endDate: ""
    });
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'retrying': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      case 'success': return 'default';
      case 'pending': return 'outline';
      case 'retrying': return 'secondary';
      default: return 'default';
    }
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
          <p className="text-red-600 mb-2">Failed to load error logs</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const logs = logsData?.logs || [];
  const pagination = logsData?.pagination;

  // Filter logs based on search query
  const filteredLogs = logs.filter(log =>
    searchQuery === "" ||
    log.workflow_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.workflow_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.node_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.execution_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.triggered_by?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <p className="text-muted-foreground">
            Monitor and manage workflow execution errors
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Error Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Error Log</DialogTitle>
              <DialogDescription>
                Create a new error log entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow_id">Workflow ID</Label>
                  <Input
                    id="workflow_id"
                    value={formData.workflow_id}
                    onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                    placeholder="Enter workflow ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="workflow_name">Workflow Name</Label>
                  <Input
                    id="workflow_name"
                    value={formData.workflow_name}
                    onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                    placeholder="Enter workflow name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="execution_id">Execution ID</Label>
                  <Input
                    id="execution_id"
                    value={formData.execution_id}
                    onChange={(e) => setFormData({ ...formData, execution_id: e.target.value })}
                    placeholder="Enter execution ID"
                  />
                </div>
                <div>
                  <Label htmlFor="node_name">Node Name</Label>
                  <Input
                    id="node_name"
                    value={formData.node_name}
                    onChange={(e) => setFormData({ ...formData, node_name: e.target.value })}
                    placeholder="Enter node name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="error_message">Error Message</Label>
                <Textarea
                  id="error_message"
                  value={formData.error_message}
                  onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
                  placeholder="Enter error message"
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="error_stack">Error Stack (Optional)</Label>
                <Textarea
                  id="error_stack"
                  value={formData.error_stack}
                  onChange={(e) => setFormData({ ...formData, error_stack: e.target.value })}
                  placeholder="Enter error stack trace"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="input_data">Input Data (JSON)</Label>
                <Textarea
                  id="input_data"
                  value={formData.input_data}
                  onChange={(e) => setFormData({ ...formData, input_data: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="retrying">Retrying</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retries_count">Retries Count</Label>
                  <Input
                    id="retries_count"
                    type="number"
                    value={formData.retries_count}
                    onChange={(e) => setFormData({ ...formData, retries_count: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="triggered_by">Triggered By</Label>
                <Input
                  id="triggered_by"
                  value={formData.triggered_by}
                  onChange={(e) => setFormData({ ...formData, triggered_by: e.target.value })}
                  placeholder="Enter who/what triggered this"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLogMutation.isPending}>
                  {createLogMutation.isPending ? "Creating..." : "Create Error Log"}
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
            placeholder="Search logs by workflow name, ID, node, error message, execution ID, or triggered by..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Status</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.statusBreakdown.find(s => s._id === 'error')?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topWorkflows.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="retrying">Retrying</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workflow-filter">Workflow</Label>
              <Select
                value={filters.workflow_id}
                onValueChange={(value) => handleFilterChange('workflow_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All workflows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All workflows</SelectItem>
                  {workflows.map((workflow: any) => (
                    <SelectItem key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="node-filter">Node Name</Label>
              <Input
                id="node-filter"
                value={filters.node_name}
                onChange={(e) => handleFilterChange('node_name', e.target.value)}
                placeholder="Search node name"
              />
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <CardTitle className="text-lg">{log.workflow_name || log.workflow_id}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(log.status)}>
                    {log.status}
                  </Badge>
                  {log.retries_count > 0 && (
                    <Badge variant="outline">
                      Retries: {log.retries_count}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(log._id)}
                    disabled={retryLogMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLog(log)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(log)}
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
                        <AlertDialogTitle>Delete Error Log</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this error log? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(log._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  <span>Workflow ID: {log.workflow_id}</span>
                  {log.execution_id && <span>Execution: {log.execution_id}</span>}
                  {log.node_name && <span>Node: {log.node_name}</span>}
                  {log.triggered_by && <span>Triggered by: {log.triggered_by}</span>}
                  <span>Time: {new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Error Message:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{log.error_message}</p>
                </div>
                {log.error_stack && (
                  <div>
                    <Label className="text-sm font-medium">Stack Trace:</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {log.error_stack}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Workflow ID</Label>
                  <p className="text-sm">{selectedLog.workflow_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Workflow Name</Label>
                  <p className="text-sm">{selectedLog.workflow_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Execution ID</Label>
                  <p className="text-sm">{selectedLog.execution_id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Node Name</Label>
                  <p className="text-sm">{selectedLog.node_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Retries Count</Label>
                  <p className="text-sm">{selectedLog.retries_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Triggered By</Label>
                  <p className="text-sm">{selectedLog.triggered_by || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Error Message</Label>
                <p className="text-sm bg-muted p-2 rounded mt-1">{selectedLog.error_message}</p>
              </div>
              {selectedLog.error_stack && (
                <div>
                  <Label className="text-sm font-medium">Stack Trace</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {selectedLog.error_stack}
                  </pre>
                </div>
              )}
              {selectedLog.input_data && (
                <div>
                  <Label className="text-sm font-medium">Input Data</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.input_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Error Log</DialogTitle>
            <DialogDescription>
              Update the error log information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-workflow_id">Workflow ID</Label>
                <Input
                  id="edit-workflow_id"
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  placeholder="Enter workflow ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-workflow_name">Workflow Name</Label>
                <Input
                  id="edit-workflow_name"
                  value={formData.workflow_name}
                  onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-execution_id">Execution ID</Label>
                <Input
                  id="edit-execution_id"
                  value={formData.execution_id}
                  onChange={(e) => setFormData({ ...formData, execution_id: e.target.value })}
                  placeholder="Enter execution ID"
                />
              </div>
              <div>
                <Label htmlFor="edit-node_name">Node Name</Label>
                <Input
                  id="edit-node_name"
                  value={formData.node_name}
                  onChange={(e) => setFormData({ ...formData, node_name: e.target.value })}
                  placeholder="Enter node name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-error_message">Error Message</Label>
              <Textarea
                id="edit-error_message"
                value={formData.error_message}
                onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
                placeholder="Enter error message"
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-error_stack">Error Stack (Optional)</Label>
              <Textarea
                id="edit-error_stack"
                value={formData.error_stack}
                onChange={(e) => setFormData({ ...formData, error_stack: e.target.value })}
                placeholder="Enter error stack trace"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-input_data">Input Data (JSON)</Label>
              <Textarea
                id="edit-input_data"
                value={formData.input_data}
                onChange={(e) => setFormData({ ...formData, input_data: e.target.value })}
                placeholder='{"key": "value"}'
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="retrying">Retrying</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-retries_count">Retries Count</Label>
                <Input
                  id="edit-retries_count"
                  type="number"
                  value={formData.retries_count}
                  onChange={(e) => setFormData({ ...formData, retries_count: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-triggered_by">Triggered By</Label>
              <Input
                id="edit-triggered_by"
                value={formData.triggered_by}
                onChange={(e) => setFormData({ ...formData, triggered_by: e.target.value })}
                placeholder="Enter who/what triggered this"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingLog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLogMutation.isPending}>
                {updateLogMutation.isPending ? "Updating..." : "Update Error Log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Logs;