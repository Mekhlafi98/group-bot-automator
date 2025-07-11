import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../api/api';
import { Badge } from '../components/ui/badge';

const API_BASE = import.meta.env.VITE_WPP_API_URL || 'https://wpp.hamedco.com/api';
const statusColors: Record<string, string> = {
  CONNECTED: 'bg-green-500',
  DISCONNECTED: 'bg-red-500',
  'WAITING QR': 'bg-yellow-500',
};
const DEFAULT_SECRET = import.meta.env.VITE_WPP_API_SECRET || 'bjkcsFg9BVtsFolKAN5eKp06baMgBQdn6A0CQS66Iwa30CVF3e';
const steps = [
  'Session Details',
  'Generate Token',
  'Start Session',
  'Session Status',
  'Send Message',
];

export default function Channels() {
  // Unified model for all channel/session data
  const [model, setModel] = useState({
    phone: '',
    type: 'whatsapp',
    webhook_url: '',
    secret: DEFAULT_SECRET,
    token: '',
    qr: '',
    status: '',
    message: '',
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [sendError, setSendError] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [debugInfo, setDebugInfo] = useState({ wppToken: '', backendToken: '' });
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Channel Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    phone: '',
    type: 'whatsapp',
    webhook_url: '',
    secret: DEFAULT_SECRET,
  });

  // Edit connection
  const handleEdit = (conn: any) => {
    setEditModel({ ...conn });
    setEditOpen(true);
  };
  const handleEditSave = async () => {
    if (!editModel) return;
    try {
      await api.put(`/channels/${editModel._id}`, {
        phone: editModel.phone,
        type: editModel.type,
        webhook_url: editModel.webhook_url,
        secret: editModel.secret,
      });
      setEditOpen(false);
      // Refresh list
      const res = await api.get('/channels');
      setConnections(res.data);
    } catch (err: any) {
      console.error('Error saving edited connection:', err);
      setErrors((prev: any) => ({ ...prev, channels: err?.response?.data?.message || err.message || 'Failed to save connection.' }));
    }
  };

  // Delete connection
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/channels/${id}`);
      setDeleteOpen(false);
      setDeleteId(null);
      // Refresh list
      const res = await api.get('/channels');
      setConnections(res.data);
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      setErrors((prev: any) => ({ ...prev, channels: err?.response?.data?.message || err.message || 'Failed to delete connection.' }));
    }
  };

  // Add Channel handler
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.post('/channels', {
        phone: createForm.phone,
        type: createForm.type,
        webhook_url: createForm.webhook_url,
        secret: createForm.secret,
      });
      setIsCreateDialogOpen(false);
      setCreateForm({ phone: '', type: 'whatsapp', webhook_url: '', secret: DEFAULT_SECRET });
      // Refresh list
      const res = await api.get('/channels');
      setConnections(res.data);
    } catch (err: any) {
      setErrors((prev: any) => ({ ...prev, create: err?.response?.data?.message || err.message || 'Failed to create channel.' }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      setConnectionsLoading(true);
      try {
        const res = await api.get('/channels');
        setConnections(res.data);
      } catch (err: any) {
        console.error('Error fetching /channels:', err);
        setErrors((prev: any) => ({ ...prev, channels: err?.response?.data?.message || err.message || 'Failed to load channels.' }));
      } finally {
        setConnectionsLoading(false);
      }
    };
    fetchConnections();
    // Debug: show backend token
    setDebugInfo((d) => ({ ...d, backendToken: localStorage.getItem('accessToken') || '' }));
  }, []);

  // Step 1: Session Details
  const handleSessionDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.phone || !model.secret) {
      setErrors({ phone: !model.phone, secret: !model.secret });
      return;
    }
    setErrors({});
    setStep(1);
  };

  // Step 2: Generate Token
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/${model.phone}/${model.secret}/generate-token`, {
        method: 'POST',
      });
      const data = await res.json();
      console.log('Generate token response:', data);
      if (data.token) {
        setModel(m => ({ ...m, token: data.token }));
        setDebugInfo((d) => ({ ...d, wppToken: data.token }));
        setStep(2);
      } else if (data.full) {
        // fallback for old API: extract token from full
        const token = data.full.split(':')[1] || data.full;
        setModel(m => ({ ...m, token }));
        setDebugInfo((d) => ({ ...d, wppToken: token }));
        setStep(2);
      } else {
        setErrors({ token: data.error || 'Failed to generate token.' });
      }
    } catch (err: any) {
      console.error('Error generating token:', err);
      setErrors({ token: err.message || 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Start Session
  const handleStartSession = async () => {
    setLoading(true);
    setErrors({});
    try {
      console.log('Using token for start-session:', model.token);
      const res = await fetch(`${API_BASE}/${model.phone}/start-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${model.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          webhook: model.webhook_url || "",
          waitQrCode: false
        }),
      });
      const data = await res.json();
      console.log('Start session response:', data); // <-- log the full response
      if (data.qrcode) {
        setModel(m => ({ ...m, qr: data.qrcode }));
      }
      if (data.status) {
        setModel(m => ({ ...m, status: data.status }));
      }
      if (data.error) {
        setErrors({ start: data.error });
      } else {
        setStep(3);
      }
    } catch (err: any) {
      console.error('Error starting session:', err);
      setErrors({ start: err.message || 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Poll session status
  useEffect(() => {
    if (step < 3 || !model.phone || !model.token) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/${model.phone}/status-session`, {
          headers: {
            Authorization: `Bearer ${model.token}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        if (data.status) {
          setModel(m => ({ ...m, status: data.status }));
        }
        if (data.qr) {
          setModel(m => ({ ...m, qr: `data:image/png;base64,${data.qr}` }));
        }
        if (data.error) {
          setErrors({ status: data.error });
        } else {
          setErrors({});
        }
      } catch (err: any) {
        console.error('Error polling status-session:', err);
        setErrors({ status: err.message || 'Network error.' });
      }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, model.phone, model.token]);

  // After successful session setup (step 3), save to DB if not already saved
  useEffect(() => {
    if (step === 3 && model.phone && model.token) {
      const saveConnection = async () => {
        try {
          // Only save if not already in the list
          if (!connections.some(c => c.phone === model.phone)) {
            await api.post('/channels', {
              phone: model.phone,
              type: model.type,
              webhook_url: model.webhook_url,
              secret: model.secret,
              token: model.token,
              status: model.status,
              qr: model.qr,
            });
            // Refresh list
            const res = await api.get('/channels');
            setConnections(res.data);
          }
        } catch (err: any) {
          console.error('Error saving new connection:', err);
          setErrors((prev: any) => ({ ...prev, channels: err?.response?.data?.message || err.message || 'Failed to save new connection.' }));
        }
      };
      saveConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, model.phone, model.token]);

  // Step 5: Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult('');
    setSendError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${model.phone}/send-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${model.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ phone: model.phone, message: model.message }),
      });
      const data = await res.json();
      console.log('Send message response:', data);
      if (data.result) {
        setSendResult('Message sent!');
      } else if (data.error) {
        setSendError(data.error);
      } else {
        setSendError('Unknown error.');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setSendError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Status polling for all channels
  useEffect(() => {
    if (connections.length === 0) return;

    const pollAllStatuses = async () => {
      const updatedConnections = await Promise.all(
        connections.map(async (channel) => {
          if (!channel.token) return channel;

          try {
            const res = await fetch(`${API_BASE}/${channel.phone}/status-session`, {
              headers: {
                Authorization: `Bearer ${channel.token}`,
                Accept: 'application/json',
              },
            });
            const data = await res.json();

            if (data.status) {
              return { ...channel, status: data.status };
            }
          } catch (err) {
            console.error(`Error polling status for ${channel.phone}:`, err);
          }
          return channel;
        })
      );

      setConnections(updatedConnections);
    };

    pollAllStatuses();
    const interval = setInterval(pollAllStatuses, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [connections.length]);

  // Filter channels based on active status
  const filteredConnections = showActiveOnly
    ? connections.filter(channel => channel.status === 'CONNECTED')
    : connections;

  // Disconnect channel
  const handleDisconnect = async (channel: any) => {
    if (!channel.token) return;

    try {
      const res = await fetch(`${API_BASE}/${channel.phone}/logout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${channel.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        // Update local status
        setConnections(prev =>
          prev.map(c =>
            c._id === channel._id
              ? { ...c, status: 'DISCONNECTED' }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error disconnecting channel:', err);
    }
  };

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex-1 flex flex-col items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mb-1 ${idx === step
            ? 'bg-blue-600'
            : idx < step
              ? 'bg-green-500'
              : 'bg-gray-300 text-gray-500'
            }`}>
            {idx + 1}
          </div>
          <span className={`text-xs text-center ${idx === step ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>{label}</span>
        </div>
      ))}
    </div>
  );

  // Channels Data Table UI
  const ChannelsTable = () => (
    <Card className="p-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Channels</h2>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showActiveOnly"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="showActiveOnly" className="text-sm">
            Show Connected Only
          </Label>
        </div>
      </div>
      {connectionsLoading ? (
        <div>Loading...</div>
      ) : connections.length === 0 ? (
        <div className="text-gray-500 text-sm">No channels found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Phone</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConnections.map((c) => (
                <tr key={c._id} className="border-b">
                  <td className="px-2 py-1 font-mono">{c.phone}</td>
                  <td className="px-2 py-1">
                    <Badge variant={c.type === 'whatsapp' ? 'default' : 'secondary'}>
                      {c.type === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                    </Badge>
                  </td>
                  <td className="px-2 py-1">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 align-middle ${statusColors[c.status] || 'bg-gray-400'}`}></span>
                    <span className="align-middle">{c.status === 'QRCODE' ? 'QR Code Required' : c.status}</span>
                  </td>
                  <td className="px-2 py-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(c)} className="mr-2">
                      <Pencil size={14} />
                    </Button>
                    {c.status === 'CONNECTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(c)}
                        className="mr-2 text-orange-600 hover:text-orange-800"
                      >
                        Disconnect
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{c.phone}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(c._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription>Update the channel information.</DialogDescription>
          </DialogHeader>
          {editModel && (
            <form onSubmit={e => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={editModel.phone} onChange={e => setEditModel((m: any) => ({ ...m, phone: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="edit-type">Channel Type</Label>
                <select
                  id="edit-type"
                  value={editModel.type}
                  onChange={e => setEditModel((m: any) => ({ ...m, type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-webhook">Webhook URL (Optional)</Label>
                <Input id="edit-webhook" value={editModel.webhook_url} onChange={e => setEditModel((m: any) => ({ ...m, webhook_url: e.target.value }))} placeholder="https://your-domain.com/webhook" />
              </div>
              <div>
                <Label htmlFor="edit-secret">Secret Key</Label>
                <Input id="edit-secret" value={editModel.secret} onChange={e => setEditModel((m: any) => ({ ...m, secret: e.target.value }))} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Channels: WhatsApp Session Wizard</h1>
      <ChannelsTable />
      <Stepper />
      <Card className="p-6 space-y-4">
        {step === 0 && (
          <form onSubmit={handleSessionDetails} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={model.phone} onChange={e => setModel(m => ({ ...m, phone: e.target.value }))} placeholder="5511900000000" required />
              {errors.phone && <span className="text-red-500 text-xs">Phone is required</span>}
            </div>
            <div>
              <Label htmlFor="secret">Secret Key</Label>
              <Input id="secret" value={model.secret} onChange={e => setModel(m => ({ ...m, secret: e.target.value }))} placeholder="THISISMYSECURETOKEN" required type="password" />
              {errors.secret && <span className="text-red-500 text-xs">Secret is required</span>}
            </div>
            <div>
              <Label htmlFor="webhook">Webhook URL (Optional)</Label>
              <Input id="webhook" value={model.webhook_url} onChange={e => setModel(m => ({ ...m, webhook_url: e.target.value }))} placeholder="https://your-domain.com/webhook" />
            </div>
            <div>
              <Label htmlFor="type">Channel Type</Label>
              <select
                id="type"
                value={model.type}
                onChange={e => setModel(m => ({ ...m, type: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Next</Button>
            </div>
          </form>
        )}
        {step === 1 && (
          <form onSubmit={handleGenerateToken} className="space-y-4">
            <div>
              <Label>Phone</Label>
              <div className="font-mono text-xs break-all">{model.phone}</div>
            </div>
            <div>
              <Label>Secret</Label>
              <div className="font-mono text-xs break-all">{model.secret}</div>
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Token'}</Button>
            {errors.token && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{errors.token}</AlertDescription></Alert>}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
              {model.token && <Button type="button" onClick={() => setStep(2)}>Next</Button>}
            </div>
          </form>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Phone</Label>
              <div className="font-mono text-xs break-all">{model.phone}</div>
            </div>
            <div>
              <Label>Token</Label>
              <div className="font-mono text-xs break-all">{model.token}</div>
            </div>
            <Button onClick={handleStartSession} disabled={loading}>{loading ? 'Starting...' : 'Start Session'}</Button>
            {errors.start && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{errors.start}</AlertDescription></Alert>}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              {(model.qr || model.status) && <Button type="button" onClick={() => setStep(3)}>Next</Button>}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-3 h-3 rounded-full ${statusColors[model.status] || 'bg-gray-400'}`}></span>
                <span className="font-mono text-sm">{model.status === 'QRCODE' ? 'QR Code Required' : (model.status || 'Unknown')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-1 text-xs text-gray-500">Scan QR in WhatsApp:</div>
                {model.qr ? (
                  <img src={model.qr} alt="QR Code" className="w-32 h-32 border rounded bg-white" />
                ) : (
                  <div className="w-32 h-32 border rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    QR will appear here
                  </div>
                )}
              </div>
            </div>
            {errors.status && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{errors.status}</AlertDescription></Alert>}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="button" onClick={() => setStep(4)}>Next</Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={model.phone} onChange={e => setModel(m => ({ ...m, phone: e.target.value }))} placeholder="5511900000000" required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input id="message" value={model.message} onChange={e => setModel(m => ({ ...m, message: e.target.value }))} placeholder="Hello from the frontend" required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</Button>
            {sendResult && <Alert variant="default"><AlertTitle>Success</AlertTitle><AlertDescription>{sendResult}</AlertDescription></Alert>}
            {sendError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{sendError}</AlertDescription></Alert>}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
} 