import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, RefreshCw, Trash2, Edit, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

function statusColor(status: string) {
    if (status === "operational") return "text-green-600";
    if (status === "degraded") return "text-yellow-600";
    if (status === "down") return "text-red-600";
    return "text-muted-foreground";
}

const SystemStatus: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [form, setForm] = useState({ name: "", url: "", description: "" });

    // Fetch all system status items
    const { data: items = [], isLoading, error } = useQuery({
        queryKey: ["system-status"],
        queryFn: async () => {
            const res = await api.get("/api/system-status");
            return Array.isArray(res.data) ? res.data : [];
        },
    });

    // Create or update
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (editItem) {
                const res = await api.put(`/api/system-status/${editItem._id}`, form);
                return res.data;
            } else {
                const res = await api.post("/api/system-status", form);
                return res.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["system-status"] });
            setIsDialogOpen(false);
            setEditItem(null);
            setForm({ name: "", url: "", description: "" });
        },
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/system-status/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["system-status"] });
        },
    });

    // Manual check
    const checkMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/api/system-status/${id}/check`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["system-status"] });
        },
    });

    const openEdit = (item: any) => {
        setEditItem(item);
        setForm({ name: item.name, url: item.url, description: item.description || "" });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">System Status</h1>
                    <p className="text-muted-foreground">Monitor the health of your services. Status is checked automatically and can be refreshed manually.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditItem(null); setForm({ name: "", url: "", description: "" }); }}>
                            <Plus className="h-4 w-4 mr-2" /> New Status
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit Status Item" : "Add Status Item"}</DialogTitle>
                            <DialogDescription>
                                Enter the name, URL to test, and an optional description.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            className="space-y-4"
                            onSubmit={e => {
                                e.preventDefault();
                                saveMutation.mutate();
                            }}
                        >
                            <div>
                                <Label>Name</Label>
                                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div>
                                <Label>URL to Test</Label>
                                <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required type="url" />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? "Saving..." : (editItem ? "Save Changes" : "Add Status")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {isLoading && <div className="text-center text-muted-foreground">Loading...</div>}
            {error && <div className="text-center text-red-600">Failed to load system status.</div>}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item: any) => (
                    <Card key={item._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    {item.status === "operational" && <CheckCircle className="h-5 w-5 text-green-600" />}
                                    {item.status === "degraded" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                                    {item.status === "down" && <XCircle className="h-5 w-5 text-red-600" />}
                                    <span className={statusColor(item.status)}>{item.name}</span>
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => checkMutation.mutate(item._id)} title="Check now">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)} title="Edit">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item._id)} title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{item.url}</div>
                            {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-1 text-xs">
                                <div>Status: <span className={statusColor(item.status)}>{item.status}</span></div>
                                <div>Last Checked: {item.lastChecked ? new Date(item.lastChecked).toLocaleString() : "-"}</div>
                                <div>Response Time: {item.lastResponseTime ? `${item.lastResponseTime} ms` : "-"}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default SystemStatus; 