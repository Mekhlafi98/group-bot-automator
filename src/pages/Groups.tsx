import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, MoreHorizontal, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TelegramGroup {
  id: string;
  chat_id: number;
  chat_title: string;
  chat_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Groups = () => {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    chat_id: "",
    chat_title: "",
    chat_type: "group"
  });
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    try {
      if (!newGroup.chat_id || !newGroup.chat_title) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('telegram_groups')
        .insert({
          chat_id: parseInt(newGroup.chat_id),
          chat_title: newGroup.chat_title,
          chat_type: newGroup.chat_type,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group added successfully"
      });

      setIsDialogOpen(false);
      setNewGroup({ chat_id: "", chat_title: "", chat_type: "group" });
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleGroupStatus = async (groupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('telegram_groups')
        .update({ is_active: !currentStatus })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Group ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.chat_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.chat_id.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Telegram Groups</h1>
            <p className="text-muted-foreground">
              Manage connected Telegram groups and channels
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Telegram Group</DialogTitle>
              <DialogDescription>
                Add a new Telegram group to monitor. You can find the chat ID by messaging @userinfobot in your group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chat_id">Chat ID *</Label>
                <Input
                  id="chat_id"
                  placeholder="-1001234567890"
                  value={newGroup.chat_id}
                  onChange={(e) => setNewGroup({ ...newGroup, chat_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="chat_title">Group Title *</Label>
                <Input
                  id="chat_title"
                  placeholder="My Telegram Group"
                  value={newGroup.chat_title}
                  onChange={(e) => setNewGroup({ ...newGroup, chat_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="chat_type">Chat Type</Label>
                <select
                  id="chat_type"
                  className="w-full p-2 border rounded-md"
                  value={newGroup.chat_type}
                  onChange={(e) => setNewGroup({ ...newGroup, chat_type: e.target.value })}
                >
                  <option value="group">Group</option>
                  <option value="supergroup">Supergroup</option>
                  <option value="channel">Channel</option>
                </select>
              </div>
              <Button onClick={handleAddGroup} className="w-full">
                Add Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Groups</CardTitle>
              <CardDescription>
                {groups.length} group{groups.length !== 1 ? 's' : ''} connected
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No groups found</p>
                        {searchTerm && (
                          <Button variant="outline" onClick={() => setSearchTerm("")}>
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.chat_title}</TableCell>
                      <TableCell className="font-mono text-sm">{group.chat_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {group.chat_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(group.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleGroupStatus(group.id, group.is_active)}
                        >
                          {group.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Groups;