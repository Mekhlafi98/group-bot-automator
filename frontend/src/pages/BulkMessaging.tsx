import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BulkMessaging: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [openContactsPopover, setOpenContactsPopover] = useState(false);

    // Fetch contacts
    const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useQuery({
        queryKey: ["contacts"],
        queryFn: async () => {
            const response = await api.get("/contacts");
            console.log("Contacts API response:", response.data);
            if (Array.isArray(response.data)) return response.data;
            if (response.data && Array.isArray(response.data.contacts)) return response.data.contacts;
            return [];
        },
    });

    // Fetch groups
    const { data: groups = [], isLoading: groupsLoading, error: groupsError } = useQuery({
        queryKey: ["groups"],
        queryFn: async () => {
            const response = await api.get("/telegram-groups");
            return Array.isArray(response.data) ? response.data : [];
        },
    });

    // Fetch bulk-message actions
    const { data: actions = [], isLoading: actionsLoading, error: actionsError } = useQuery({
        queryKey: ["actions"],
        queryFn: async () => {
            const response = await api.get("/actions");
            const arr = Array.isArray(response.data) ? response.data : [];
            return arr.filter((a: any) => a.type === "bulk-message");
        },
    });

    // Create action mutation
    const createActionMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post("/actions", {
                type: "bulk-message",
                name: `Bulk Message ${new Date().toLocaleString()}`,
                config: {
                    contacts: selectedContacts,
                    groups: selectedGroups,
                    message,
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["actions"] });
            setSelectedContacts([]);
            setSelectedGroups([]);
            setMessage("");
            setIsDialogOpen(false);
        },
    });

    // Execute action mutation
    const executeActionMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/actions/${id}/execute`);
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
        },
    });

    // Filter actions by search
    const filteredActions = actions.filter((action: any) =>
        action.name.toLowerCase().includes(search.toLowerCase()) ||
        action.config.message?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bulk Messaging</h1>
                    <p className="text-muted-foreground">Create and manage bulk message actions to send messages to multiple contacts or groups at once.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> New Bulk Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Bulk Message Action</DialogTitle>
                            <DialogDescription>
                                Select contacts and/or groups, enter your message, and save as an action.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4"
                            onSubmit={e => {
                                e.preventDefault();
                                createActionMutation.mutate();
                            }}
                        >
                            <div>
                                <Label>Select Contacts</Label>
                                <Popover open={openContactsPopover} onOpenChange={setOpenContactsPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openContactsPopover}
                                            className="w-full justify-between"
                                        >
                                            {selectedContacts.length > 0
                                                ? `${selectedContacts.length} contact(s) selected`
                                                : "Select contacts..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search contacts..." />
                                            <CommandList>
                                                <CommandEmpty>No contacts found.</CommandEmpty>
                                                <CommandGroup>
                                                    {Array.isArray(contacts) && contacts.map((contact: any) => (
                                                        <CommandItem
                                                            key={contact._id}
                                                            value={contact.name}
                                                            onSelect={() => {
                                                                const isSelected = selectedContacts.includes(contact._id);
                                                                const newContactIds = isSelected
                                                                    ? selectedContacts.filter(id => id !== contact._id)
                                                                    : [...selectedContacts, contact._id];
                                                                setSelectedContacts(newContactIds);
                                                            }}
                                                        >
                                                            <Check
                                                                className={
                                                                    "mr-2 h-4 w-4 " + (selectedContacts.includes(contact._id) ? "opacity-100" : "opacity-0")
                                                                }
                                                            />
                                                            {contact.name} ({contact.number})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedContacts.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {selectedContacts.map((contactId) => {
                                            const contact = Array.isArray(contacts) ? contacts.find((c: any) => c._id === contactId) : undefined;
                                            return contact ? (
                                                <Badge key={contactId} variant="secondary" className="text-xs">
                                                    {contact.name}
                                                    <X
                                                        className="ml-1 h-3 w-3 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
                                                        }}
                                                    />
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Message</Label>
                                <Input
                                    placeholder="Type your message..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createActionMutation.isPending}>
                                    {createActionMutation.isPending ? "Creating..." : "Create Action"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search bar */}
            <div className="flex items-center space-x-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search actions by name or message..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Loading/Error states */}
            {(contactsLoading || groupsLoading || actionsLoading) && (
                <div className="text-center text-muted-foreground">Loading...</div>
            )}
            {(contactsError || groupsError || actionsError) && (
                <div className="text-center text-red-600">Failed to load data.</div>
            )}

            {/* Actions list */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredActions.length === 0 && !actionsLoading && (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No bulk message actions found.
                        </CardContent>
                    </Card>
                )}
                {filteredActions.map((action: any) => (
                    <Card key={action._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{action.name}</CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => executeActionMutation.mutate(action._id)}
                                    disabled={executeActionMutation.isPending}
                                >
                                    Send
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Contacts: {action.config.contacts?.length || 0}, Groups: {action.config.groups?.length || 0}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground truncate max-w-xs mb-2">
                                Message: {action.config.message}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Show result */}
            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Send Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                        <Button className="mt-2" onClick={() => setResult(null)}>
                            Close
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default BulkMessaging; 