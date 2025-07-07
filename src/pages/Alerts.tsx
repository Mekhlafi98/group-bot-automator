import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ChevronsUpDown, Check, X, AlertTriangle, Trash2, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";

const Alerts: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedContact, setSelectedContact] = useState<string>("");
    const [selectedFilter, setSelectedFilter] = useState<string>("");
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [openContactsPopover, setOpenContactsPopover] = useState(false);

    // Fetch contacts
    const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useQuery({
        queryKey: ["contacts"],
        queryFn: async () => {
            const response = await api.get("/api/contacts");
            if (Array.isArray(response.data)) return response.data;
            if (response.data && Array.isArray(response.data.contacts)) return response.data.contacts;
            return [];
        },
    });

    // Fetch filters
    const { data: filters = [], isLoading: filtersLoading, error: filtersError } = useQuery({
        queryKey: ["filters"],
        queryFn: async () => {
            const response = await api.get("/api/message-filters");
            return Array.isArray(response.data) ? response.data : [];
        },
    });

    // Fetch alerts (actions of type alert)
    const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery({
        queryKey: ["actions"],
        queryFn: async () => {
            const response = await api.get("/api/actions");
            const arr = Array.isArray(response.data) ? response.data : [];
            return arr.filter((a: any) => a.type === "alert" || a.type === "notification"); // support legacy
        },
    });

    // Create alert action mutation
    const createAlertMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post("/api/actions", {
                type: "alert",
                name: `Alert ${new Date().toLocaleString()}`,
                config: {
                    contactId: selectedContact,
                    filterId: selectedFilter,
                    message,
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["actions"] });
            setSelectedContact("");
            setSelectedFilter("");
            setMessage("");
            setIsDialogOpen(false);
        },
    });

    // Execute alert action mutation
    const executeAlertMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/api/actions/${id}/execute`);
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ["actions"] });
        },
    });

    // Delete alert
    const deleteAlertMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/actions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["actions"] });
        },
    });

    // Filter alerts by search
    const filteredAlerts = alerts.filter((alert: any) =>
        alert.name.toLowerCase().includes(search.toLowerCase()) ||
        alert.config.message?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Alerts</h1>
                    <p className="text-muted-foreground">Create and manage alert actions to send targeted messages to specific contacts using filters.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> New Alert
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Alert Action</DialogTitle>
                            <DialogDescription>
                                Select a contact, choose a filter, and enter your alert message.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4"
                            onSubmit={e => {
                                e.preventDefault();
                                createAlertMutation.mutate();
                            }}
                        >
                            <div>
                                <Label>Select Contact</Label>
                                <Popover open={openContactsPopover} onOpenChange={setOpenContactsPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openContactsPopover}
                                            className="w-full justify-between"
                                        >
                                            {selectedContact
                                                ? contacts.find((c: any) => c._id === selectedContact)?.name || "Unknown contact"
                                                : "Select contact..."}
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
                                                                setSelectedContact(contact._id);
                                                                setOpenContactsPopover(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={
                                                                    "mr-2 h-4 w-4 " + (selectedContact === contact._id ? "opacity-100" : "opacity-0")
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
                            </div>
                            <div>
                                <Label>Select Filter</Label>
                                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a filter..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.isArray(filters) && filters.map((filter: any) => (
                                            <SelectItem key={filter._id} value={filter._id}>
                                                {filter.filterName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Alert Message</Label>
                                <Input
                                    placeholder="Type your alert message..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createAlertMutation.isPending}>
                                    {createAlertMutation.isPending ? "Creating..." : "Create Action"}
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
                        placeholder="Search alerts by name or message..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Loading/Error states */}
            {(contactsLoading || filtersLoading || alertsLoading) && (
                <div className="text-center text-muted-foreground">Loading...</div>
            )}
            {(contactsError || filtersError || alertsError) && (
                <div className="text-center text-red-600">Failed to load data.</div>
            )}

            {/* Alerts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                                    <th className="px-3 py-2 text-left font-semibold">Contact</th>
                                    <th className="px-3 py-2 text-left font-semibold">Filter</th>
                                    <th className="px-3 py-2 text-left font-semibold">Message</th>
                                    <th className="px-3 py-2 text-left font-semibold">Last Sent</th>
                                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                                    <th className="px-3 py-2 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlerts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted-foreground py-6">No alerts found.</td>
                                    </tr>
                                )}
                                {filteredAlerts.map((alert: any) => {
                                    const contact = Array.isArray(contacts) ? contacts.find((c: any) => c._id === alert.config.contactId) : undefined;
                                    const filter = Array.isArray(filters) ? filters.find((f: any) => f._id === alert.config.filterId) : undefined;
                                    // For now, use alert.updatedAt as Last Sent and alert.status as Status (to be improved with backend tracking)
                                    return (
                                        <tr key={alert._id} className="border-b hover:bg-muted/50">
                                            <td className="px-3 py-2 font-medium">{alert.name}</td>
                                            <td className="px-3 py-2">{contact?.name || "Unknown"}</td>
                                            <td className="px-3 py-2">{filter?.filterName || "Unknown"}</td>
                                            <td className="px-3 py-2 max-w-xs truncate">{alert.config.message}</td>
                                            <td className="px-3 py-2">{alert.updatedAt ? new Date(alert.updatedAt).toLocaleString() : "-"}</td>
                                            <td className="px-3 py-2">
                                                <Badge variant="secondary">{alert.status || "-"}</Badge>
                                            </td>
                                            <td className="px-3 py-2 flex gap-2">
                                                <Button size="icon" variant="ghost" title="Send" onClick={() => executeAlertMutation.mutate(alert._id)}>
                                                    <Bell className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" title="Delete" onClick={() => deleteAlertMutation.mutate(alert._id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

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

export default Alerts; 