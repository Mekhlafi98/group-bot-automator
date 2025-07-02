import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, RefreshCw, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageLog {
  id: string;
  message_id: number;
  sender_id: number;
  sender_username?: string;
  message_text?: string;
  message_type: string;
  matched_filter_type?: string;
  matched_filter_value?: string;
  workflow_triggered: boolean;
  workflow_response?: string;
  processed_at: string;
  telegram_groups?: {
    chat_title: string;
  };
  message_filters?: {
    filter_name: string;
  };
  n8n_workflows?: {
    name: string;
  };
}

interface TelegramGroup {
  id: string;
  chat_title: string;
}

const Logs = () => {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('message_logs')
        .select(`
          *,
          telegram_groups (chat_title),
          message_filters (filter_name),
          n8n_workflows (name)
        `)
        .order('processed_at', { ascending: false })
        .limit(100);

      if (selectedGroup !== "all") {
        query = query.eq('group_id', selectedGroup);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
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

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_groups')
        .select('id, chat_title')
        .order('chat_title');

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchLogs();
  }, [selectedGroup]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sender_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.telegram_groups?.chat_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "triggered" && log.workflow_triggered) ||
      (filterType === "not_triggered" && !log.workflow_triggered) ||
      (filterType === log.message_type);

    return matchesSearch && matchesFilter;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

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
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Message Logs</h1>
            <p className="text-muted-foreground">
              View processed messages and workflow triggers
            </p>
          </div>
        </div>

        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Last {logs.length} processed messages
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.chat_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="triggered">Workflow Triggered</SelectItem>
                  <SelectItem value="not_triggered">No Trigger</SelectItem>
                  <SelectItem value="text">Text Messages</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="sticker">Stickers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Filter</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages found</p>
                        {searchTerm && (
                          <Button variant="outline" onClick={() => setSearchTerm("")}>
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.processed_at)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.telegram_groups?.chat_title || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.sender_username || `User ${log.sender_id}`}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {log.sender_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.message_text || ''}>
                          {truncateText(log.message_text || 'No text content')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.message_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.message_filters ? (
                          <div>
                            <div className="font-medium text-sm">{log.message_filters.filter_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.matched_filter_type}: {truncateText(log.matched_filter_value || '', 20)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No match</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.n8n_workflows?.name || (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.workflow_triggered ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Triggered</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Not triggered</span>
                            </div>
                          )}
                        </div>
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

export default Logs;