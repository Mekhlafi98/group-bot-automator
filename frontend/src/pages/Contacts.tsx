import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, User, Phone, Ban, CheckCircle, XCircle, Search, MoreHorizontal, Filter, Download, Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { useToast } from "@/hooks/use-toast";

interface Contact {
    _id: string;
    name: string;
    contact_uid?: string;
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
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        contact_uid: "",
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
                const response = await api.get(`/contacts/search?q=${encodeURIComponent(searchQuery)}`);
                return response.data;
            } else {
                const response = await api.get('/contacts');
                return response.data;
            }
        }
    });

    // Extract contacts array from response
    const contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);

    // Filter contacts based on active status
    const filteredContacts = showActiveOnly ? contacts.filter(contact => contact.isActive) : contacts;

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedContacts(filteredContacts.map(contact => contact._id));
        } else {
            setSelectedContacts([]);
        }
    };

    const handleSelectContact = (contactId: string, checked: boolean) => {
        if (checked) {
            setSelectedContacts(prev => [...prev, contactId]);
        } else {
            setSelectedContacts(prev => prev.filter(id => id !== contactId));
        }
    };

    // Bulk actions
    const handleBulkDelete = async () => {
        if (selectedContacts.length === 0) return;

        try {
            await Promise.all(selectedContacts.map(id => api.delete(`/contacts/${id}`)));
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setSelectedContacts([]);
            toast({
                title: "Success",
                description: `${selectedContacts.length} contact(s) deleted successfully`,
                variant: "default"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete contacts",
                variant: "destructive"
            });
        }
    };

    const handleBulkToggleBlocked = async (blocked: boolean) => {
        if (selectedContacts.length === 0) return;

        try {
            await Promise.all(selectedContacts.map(id =>
                api.patch(`/contacts/${id}/toggle-status`, {
                    field: 'isBlocked',
                    value: blocked
                })
            ));
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setSelectedContacts([]);
            toast({
                title: "Success",
                description: `${selectedContacts.length} contact(s) ${blocked ? 'blocked' : 'unblocked'} successfully`,
                variant: "default"
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update contacts",
                variant: "destructive"
            });
        }
    };

    const handleBulkExport = () => {
        if (selectedContacts.length === 0) return;

        const selectedContactData = filteredContacts.filter(contact =>
            selectedContacts.includes(contact._id)
        );

        const csvContent = [
            ['Name', 'Contact UID', 'Number', 'Status', 'Blocked', 'Notes', 'Created At'],
            ...selectedContactData.map(contact => [
                contact.name,
                contact.contact_uid || '',
                contact.number,
                contact.isActive ? 'Active' : 'Inactive',
                contact.isBlocked ? 'Yes' : 'No',
                contact.notes || '',
                new Date(contact.createdAt).toLocaleDateString()
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: "Success",
            description: `${selectedContacts.length} contact(s) exported successfully`,
            variant: "default"
        });
    };

    // Create contact mutation
    const createContactMutation = useMutation({
        mutationFn: async (data: Omit<Contact, '_id' | 'createdAt' | 'updatedAt'>) => {
            const response = await api.post('/contacts', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setIsCreateDialogOpen(false);
            setFormData({ name: "", contact_uid: "", number: "", notes: "", isActive: true, isBlocked: false });
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
            const response = await api.put(`/contacts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setEditingContact(null);
            setFormData({ name: "", contact_uid: "", number: "", notes: "", isActive: true, isBlocked: false });
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
            await api.delete(`/contacts/${id}`);
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
            const response = await api.patch(`/contacts/${id}/toggle-status`, {
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
            contact_uid: contact.contact_uid || "",
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
                                <Label htmlFor="contact_uid">Contact UID (Optional)</Label>
                                <Input
                                    id="contact_uid"
                                    value={formData.contact_uid}
                                    onChange={(e) => setFormData({ ...formData, contact_uid: e.target.value })}
                                    placeholder="Enter contact UID"
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

            {/* Search and Filters */}
            <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search contacts..."
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
                {selectedContacts.length > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            {selectedContacts.length} selected
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
                                <DropdownMenuItem onClick={() => handleBulkToggleBlocked(false)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Unblock Selected
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBulkToggleBlocked(true)}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Block Selected
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
                                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact UID</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No contacts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <TableRow key={contact._id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedContacts.includes(contact._id)}
                                                onCheckedChange={(checked) => handleSelectContact(contact._id, checked as boolean)}
                                                aria-label={`Select ${contact.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {contact.contact_uid || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{contact.number}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant={contact.isActive ? "default" : "secondary"}>
                                                    {contact.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                                {contact.isBlocked && (
                                                    <Badge variant="destructive">
                                                        Blocked
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {contact.notes || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(contact.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleBlocked(contact._id)}>
                                                        {contact.isBlocked ? (
                                                            <>
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Unblock
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Block
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(contact._id)}
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
                            <Label htmlFor="edit-contact_uid">Contact UID (Optional)</Label>
                            <Input
                                id="edit-contact_uid"
                                value={formData.contact_uid}
                                onChange={(e) => setFormData({ ...formData, contact_uid: e.target.value })}
                                placeholder="Enter contact UID"
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