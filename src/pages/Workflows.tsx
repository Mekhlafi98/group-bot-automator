import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Workflow, ExternalLink, Play, Pause, User, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface Workflow {
  _id: string;
  name: string;
  workflowId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Workflows = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    workflowId: "",
    description: "",
    isActive: true
  });
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: async (): Promise<Workflow[]> => {
      const response = await api.get('/api/workflows');
      return response.data;
    }
  });

  // Filter workflows based on active status and search query
  const filteredWorkflows = (showActiveOnly ? workflows.filter(workflow => workflow.isActive) : workflows)
    .filter(workflow =>
      searchQuery === "" ||
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.workflowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: Omit<Workflow, '_id' | 'createdAt' | 'updatedAt'>) => {
      console.log('Creating workflow with data:', data);
      const response = await api.post('/api/workflows', data);
      console.log('Workflow created successfully:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('Create workflow onSuccess called');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Success",
        description: "Workflow created successfully",
        variant: "default"
      });
      handleCreateDialogChange(false);
      console.log('Dialog should be closed now');
    },
    onError: (error: any) => {
      console.error('Create workflow error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to create workflow',
        variant: "destructive"
      });
    }
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Workflow> }) => {
      const response = await api.put(`/api/workflows/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Success",
        description: "Workflow updated successfully",
        variant: "default"
      });
      setFormData({ name: "", workflowId: "", description: "", isActive: true });
      setEditingWorkflow(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to update workflow',
        variant: "destructive"
      });
    }
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to delete workflow',
        variant: "destructive"
      });
    }
  });

  // Toggle workflow status mutation
  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.put(`/api/workflows/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Success",
        description: "Workflow status updated",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to update workflow status',
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called, editingWorkflow:', editingWorkflow);
    console.log('formData:', formData);
    if (editingWorkflow) {
      console.log('Updating workflow');
      updateWorkflowMutation.mutate({ id: editingWorkflow._id, data: formData });
    } else {
      console.log('Creating workflow');
      createWorkflowMutation.mutate(formData);
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      workflowId: workflow.workflowId,
      description: workflow.description,
      isActive: workflow.isActive
    });
  };

  const handleDelete = (id: string) => {
    deleteWorkflowMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleWorkflowMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleCreateDialogChange = (open: boolean) => {
    console.log('Create dialog onOpenChange called with:', open);
    setIsCreateDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setFormData({ name: "", workflowId: "", description: "", isActive: true });
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
          <p className="text-red-600 mb-2">Failed to load workflows</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage your automation workflows
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Your Workflows Only
            </Badge>
          </div>
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
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Workflow</DialogTitle>
              <DialogDescription>
                Add a new workflow to your bot's automation system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Automation Workflow"
                  required
                />
              </div>
              <div>
                <Label htmlFor="workflowId">Workflow ID</Label>
                <Input
                  id="workflowId"
                  value={formData.workflowId}
                  onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                  placeholder="Enter your workflow ID"
                  className="col-span-3"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of what this workflow does"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWorkflowMutation.isPending}>
                  {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
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
            placeholder="Search workflows by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge variant={workflow.isActive ? "default" : "secondary"}>
                  {workflow.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>Workflow ID: {workflow.workflowId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.description && (
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{workflow.workflowId}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(workflow._id, workflow.isActive)}
                    disabled={toggleWorkflowMutation.isPending}
                  >
                    {workflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {workflow.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(workflow)}
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
                        <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(workflow._id)}
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
      <Dialog open={!!editingWorkflow} onOpenChange={() => setEditingWorkflow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>
              Update the workflow information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Workflow Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Automation Workflow"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-workflowId">Workflow ID</Label>
              <Input
                id="edit-workflowId"
                value={formData.workflowId}
                onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                placeholder="Enter your workflow ID"
                className="col-span-3"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of what this workflow does"
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
              <Button type="button" variant="outline" onClick={() => setEditingWorkflow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateWorkflowMutation.isPending}>
                {updateWorkflowMutation.isPending ? "Updating..." : "Update Workflow"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workflows;