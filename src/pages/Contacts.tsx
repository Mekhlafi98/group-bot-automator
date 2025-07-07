import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, User, Phone, Ban, CheckCircle, XCircle, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface Contact {
    _id: string;
    name: string;
    number: string;
    isActive: boolean;
    isBlocked: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

const Contacts = () => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        number: "",
        notes: "",
        isActive: true,
        isBlocked: false
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch contacts
    const { data: contactsData, isLoading, error } = useQuery({
        queryKey: ['contacts', searchQuery],
        queryFn: async (): Promise<{ contacts: Contact[], pagination?: any } | Contact[]> => {
            if (searchQuery) {
                const response = await api.get(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`);
                return response.data;
            } else {
                const response = await api.get('/api/contacts');
                return response.data;
            }
        }
    });

    // Extract contacts array from response
    const contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);

    // Filter contacts based on active status
    const filteredContacts = showActiveOnly ? contacts.filter(contact => contact.isActive) : contacts;

    // Create contact mutation
    const createContactMutation = useMutation({
        mutationFn: async (data: Omit<Contact, '_id' | 'createdAt' | 'updatedAt'>) => {
            const response = await api.post('/api/contacts', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setIsCreateDialogOpen(false);
            setFormData({ name: "", number: "", notes: "", isActive: true, isBlocked: false });
            toast({
                title: "Success",
                description: "Contact created successfully",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create contact",
                variant: "destructive"
            });
        }
    });

    // Update contact mutation
    const updateContactMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
            const response = await api.put(`/api/contacts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setEditingContact(null);
            setFormData({ name: "", number: "", notes: "", isActive: true, isBlocked: false });
            toast({
                title: "Success",
                description: "Contact updated successfully",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update contact",
                variant: "destructive"
            });
        }
    });

    // Delete contact mutation
    const deleteContactMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/contacts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({
                title: "Success",
                description: "Contact deleted successfully",
                variant: "default"
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete contact",
                variant: "destructive"
            });
        }
    });

    // Toggle blocked status mutation
    const toggleBlockedMutation = useMutation({
        mutationFn: async (id: string) => {
            console.log('Toggling blocked status for contact:', id);
            const response = await api.patch(`/api/contacts/${id}/toggle-status`, {
                field: 'isBlocked'
            });
            console.log('Toggle response:', response.data);
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Toggle success:', data);
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            toast({
                title: "Success",
                description: "Contact status updated",
                variant: "default"
            });
        },
        onError: (error: any) => {
            console.error('Toggle error:', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update contact status",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingContact) {
            updateContactMutation.mutate({ id: editingContact._id, data: formData });
        } else {
            createContactMutation.mutate({
                ...formData,
                isActive: true,
                isBlocked: false
            });
        }
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            number: contact.number,
            notes: contact.notes || "",
            isActive: contact.isActive,
            isBlocked: contact.isBlocked
        });
    };

    const handleDelete = (id: string) => {
        deleteContactMutation.mutate(id);
    };

    const handleToggleBlocked = (id: string) => {
        toggleBlockedMutation.mutate(id);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // The search is handled by the query key change
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
                    <p className="text-red-600 mb-2">Failed to load contacts</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground">
                        Manage your contact list for the bot
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
                            Add Contact
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Contact</DialogTitle>
                            <DialogDescription>
                                Create a new contact entry
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter contact name"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="number">Phone Number</Label>
                                <Input
                                    id="number"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add any notes about this contact"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createContactMutation.isPending}>
                                    {createContactMutation.isPending ? "Creating..." : "Create Contact"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search contacts by name, number, or notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredContacts.map((contact) => (
                    <Card key={contact._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{contact.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Badge variant={contact.isActive ? "default" : "secondary"}>
                                        {contact.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {contact.isBlocked && (
                                        <Badge variant="destructive">
                                            Blocked
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardDescription>
                                {contact.number}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {contact.notes && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-sm text-muted-foreground">Notes:</span>
                                        <span className="text-sm">{contact.notes}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleToggleBlocked(contact._id)}
                                        disabled={toggleBlockedMutation.isPending}
                                    >
                                        {contact.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                        {contact.isBlocked ? "Unblock" : "Block"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(contact)}
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
                                                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{contact.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(contact._id)}
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
            <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>
                            Update the contact information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter contact name"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-number">Phone Number</Label>
                            <Input
                                id="edit-number"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-notes">Notes (Optional)</Label>
                            <Textarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any notes about this contact"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center space-x-4">
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
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="edit-isBlocked"
                                    checked={formData.isBlocked}
                                    onChange={(e) => setFormData({ ...formData, isBlocked: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="edit-isBlocked">Blocked</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateContactMutation.isPending}>
                                {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Contacts; 