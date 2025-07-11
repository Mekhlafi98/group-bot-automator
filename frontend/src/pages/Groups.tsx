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
import { Plus, Edit, Trash2, Users, MessageSquare, User, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  _id: string;
  name: string;
  number: string;
  isActive: boolean;
  isBlocked: boolean;
}

interface TelegramGroup {
  _id: string;
  chatId: string;
  title: string;
  type: string;
  isActive: boolean;
  contacts?: string[];
  welcome_message?: string;
  createdAt: string;
  updatedAt: string;
}

const Groups = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null);
  const [formData, setFormData] = useState({
    chatId: "",
    title: "",
    type: "group",
    isActive: true,
    contacts: [] as string[],
    welcome_message: "",
  });
  const [openContactsPopover, setOpenContactsPopover] = useState(false);
  const [openEditContactsPopover, setOpenEditContactsPopover] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['telegram-groups'],
    queryFn: async (): Promise<TelegramGroup[]> => {
      const response = await api.get('/telegram-groups');
      return response.data;
    }
  });

  // Fetch contacts for multi-select
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async (): Promise<{ contacts: Contact[]; pagination: any }> => {
      const response = await api.get('/contacts');
      return response.data;
    }
  });

  // Extract contacts array from the response
  const contacts = contactsData?.contacts || [];

  // Filter groups based on active status and search query
  const filteredGroups = (showActiveOnly ? groups.filter(group => group.isActive) : groups)
    .filter(group =>
      searchQuery === "" ||
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.chatId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: Omit<TelegramGroup, '_id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post('/telegram-groups', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-groups'] });
      setIsCreateDialogOpen(false);
      setFormData({ chatId: "", title: "", type: "group", isActive: true, contacts: [], welcome_message: "" });
      toast({
        title: "Success",
        description: "Group created successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create group",
        variant: "destructive"
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TelegramGroup> }) => {
      const response = await api.put(`/telegram-groups/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-groups'] });
      setEditingGroup(null);
      setFormData({ chatId: "", title: "", type: "group", isActive: true, contacts: [], welcome_message: "" });
      toast({
        title: "Success",
        description: "Group updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update group",
        variant: "destructive"
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/telegram-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-groups'] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete group",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup._id, data: formData });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleEdit = (group: TelegramGroup) => {
    setEditingGroup(group);
    setFormData({
      chatId: group.chatId,
      title: group.title,
      type: group.type,
      isActive: group.isActive,
      contacts: group.contacts || [],
      welcome_message: group.welcome_message || "",
    });
  };

  const handleDelete = (id: string) => {
    deleteGroupMutation.mutate(id);
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
          <p className="text-red-600 mb-2">Failed to load groups</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">
            Manage your groups and channels
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Your Groups Only
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Group</DialogTitle>
              <DialogDescription>
                Add a new group to your bot's management system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  value={formData.chatId}
                  onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                  placeholder="e.g., -1001234567890"
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Group Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Group"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Group Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="group">Group</option>
                  <option value="supergroup">Supergroup</option>
                  <option value="channel">Channel</option>
                </select>
              </div>
              <div>
                <Label htmlFor="contacts">Contacts (Optional)</Label>
                <Popover open={openContactsPopover} onOpenChange={setOpenContactsPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openContactsPopover}
                      className="w-full justify-between"
                    >
                      {formData.contacts.length > 0
                        ? `${formData.contacts.length} contact(s) selected`
                        : "Select contacts..."
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandList>
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup>
                          {Array.isArray(contacts) && contacts.map((contact) => (
                            <CommandItem
                              key={contact._id}
                              value={contact.name}
                              onSelect={() => {
                                const isSelected = formData.contacts.includes(contact._id);
                                const newContactIds = isSelected
                                  ? formData.contacts.filter(id => id !== contact._id)
                                  : [...formData.contacts, contact._id];
                                setFormData({ ...formData, contacts: newContactIds });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.contacts.includes(contact._id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {contact.name} ({contact.number})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.contacts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.contacts.map((contactId) => {
                      const contact = Array.isArray(contacts) ? contacts.find(c => c._id === contactId) : undefined;
                      return contact ? (
                        <Badge key={contactId} variant="secondary" className="text-xs">
                          {contact.name}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                contacts: formData.contacts.filter(id => id !== contactId)
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
                <Label htmlFor="welcome_message">Welcome Message (Optional)</Label>
                <textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="Enter a welcome message for new members..."
                  className="w-full p-2 border rounded-md min-h-[80px] resize-vertical"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
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
            placeholder="Search groups by name, chat ID, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.title}</CardTitle>
                <Badge variant={group.isActive ? "default" : "secondary"}>
                  {group.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>ID: {group.chatId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{group.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Chat ID: {group.chatId}</span>
                </div>
                {group.welcome_message && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Welcome Message:</span>
                    <span className="text-sm text-gray-600">{group.welcome_message}</span>
                  </div>
                )}
                {group.contacts && group.contacts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Contacts: </span>
                    <div className="flex flex-wrap gap-1">
                      {group.contacts.map((contactId) => {
                        const contact = Array.isArray(contacts) ? contacts.find(c => c._id === contactId) : undefined;
                        return contact ? (
                          <Badge key={contactId} variant="outline" className="text-xs">
                            {contact.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
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
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{group.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(group._id)}
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
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-chatId">Chat ID</Label>
              <Input
                id="edit-chatId"
                value={formData.chatId}
                onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                placeholder="e.g., -1001234567890"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-title">Group Name</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Group"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Group Type</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="group">Group</option>
                <option value="supergroup">Supergroup</option>
                <option value="channel">Channel</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-contacts">Contacts (Optional)</Label>
              <Popover open={openEditContactsPopover} onOpenChange={setOpenEditContactsPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEditContactsPopover}
                    className="w-full justify-between"
                  >
                    {formData.contacts.length > 0
                      ? `${formData.contacts.length} contact(s) selected`
                      : "Select contacts..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search contacts..." />
                    <CommandList>
                      <CommandEmpty>No contacts found.</CommandEmpty>
                      <CommandGroup>
                        {Array.isArray(contacts) && contacts.map((contact) => (
                          <CommandItem
                            key={contact._id}
                            value={contact.name}
                            onSelect={() => {
                              const isSelected = formData.contacts.includes(contact._id);
                              const newContactIds = isSelected
                                ? formData.contacts.filter(id => id !== contact._id)
                                : [...formData.contacts, contact._id];
                              setFormData({ ...formData, contacts: newContactIds });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.contacts.includes(contact._id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {contact.name} ({contact.number})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.contacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.contacts.map((contactId) => {
                    const contact = Array.isArray(contacts) ? contacts.find(c => c._id === contactId) : undefined;
                    return contact ? (
                      <Badge key={contactId} variant="secondary" className="text-xs">
                        {contact.name}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              contacts: formData.contacts.filter(id => id !== contactId)
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
              <Label htmlFor="edit-welcome_message">Welcome Message (Optional)</Label>
              <textarea
                id="edit-welcome_message"
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                placeholder="Enter a welcome message for new members..."
                className="w-full p-2 border rounded-md min-h-[80px] resize-vertical"
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
              <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateGroupMutation.isPending}>
                {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;