import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../api/api';

const API_BASE = import.meta.env.VITE_WPP_API_URL || 'http://localhost:21465/api';
const statusColors: Record<string, string> = {
  CONNECTED: 'bg-green-500',
  DISCONNECTED: 'bg-red-500',
  'WAITING QR': 'bg-yellow-500',
};
const DEFAULT_SECRET = import.meta.env.VITE_WPP_API_SECRET || '';
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
    session: '',
    secret: DEFAULT_SECRET,
    token: '',
    qr: '',
    status: '',
    phone: '',
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

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit connection
  const handleEdit = (conn: any) => {
    setEditModel({ ...conn });
    setEditOpen(true);
  };
  const handleEditSave = async () => {
    if (!editModel) return;
    try {
      await api.put(`/channels/${editModel._id}`, {
        session: editModel.session,
        secret: editModel.secret,
      });
      setEditOpen(false);
      // Refresh list
      const res = await api.get('/channels');
      setConnections(res.data);
    } catch (err) {
      // Optionally show error
    }
  };

  // Delete connection
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/channels/${deleteId}`);
      setDeleteOpen(false);
      setDeleteId(null);
      // Refresh list
      const res = await api.get('/channels');
      setConnections(res.data);
    } catch (err) {
      // Optionally show error
    }
  };

  // Fetch saved connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      setConnectionsLoading(true);
      try {
        const res = await api.get('/channels');
        setConnections(res.data);
      } catch (err) {
        // ignore for now
      } finally {
        setConnectionsLoading(false);
      }
    };
    fetchConnections();
  }, []);

  // Step 1: Session Details
  const handleSessionDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.session || !model.secret) {
      setErrors({ session: !model.session, secret: !model.secret });
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
      const res = await fetch(`${API_BASE}/${model.session}/${model.secret}/generate-token`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.full) {
        setModel(m => ({ ...m, token: data.full }));
        setStep(2);
      } else {
        setErrors({ token: data.error || 'Failed to generate token.' });
      }
    } catch (err) {
      setErrors({ token: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Start Session
  const handleStartSession = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/${model.session}/start-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${model.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.qr) {
        setModel(m => ({ ...m, qr: `data:image/png;base64,${data.qr}` }));
      }
      if (data.status) {
        setModel(m => ({ ...m, status: data.status }));
      }
      if (data.error) {
        setErrors({ start: data.error });
      } else {
        setStep(3);
      }
    } catch (err) {
      setErrors({ start: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Poll session status
  useEffect(() => {
    if (step < 3 || !model.session || !model.token) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/${model.session}/status-session`, {
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
      } catch (err) {
        setErrors({ status: 'Network error.' });
      }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, model.session, model.token]);

  // After successful session setup (step 3), save to DB if not already saved
  useEffect(() => {
    if (step === 3 && model.session && model.token) {
      const saveConnection = async () => {
        try {
          // Only save if not already in the list
          if (!connections.some(c => c.session === model.session)) {
            await api.post('/channels', {
              session: model.session,
              secret: model.secret,
              token: model.token,
              status: model.status,
              qr: model.qr,
            });
            // Refresh list
            const res = await api.get('/channels');
            setConnections(res.data);
          }
        } catch (err) {
          // ignore for now
        }
      };
      saveConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, model.session, model.token]);

  // Step 5: Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult('');
    setSendError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${model.session}/send-message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${model.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ phone: model.phone, message: model.message }),
      });
      const data = await res.json();
      if (data.result) {
        setSendResult('Message sent!');
      } else if (data.error) {
        setSendError(data.error);
      } else {
        setSendError('Unknown error.');
      }
    } catch (err) {
      setSendError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex-1 flex flex-col items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mb-1 ${
            idx === step
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

  // Connections List UI
  const ConnectionsList = () => (
    <Card className="p-4 mb-8">
      <h2 className="text-lg font-semibold mb-2">Saved Connections</h2>
      {connectionsLoading ? (
        <div>Loading...</div>
      ) : connections.length === 0 ? (
        <div className="text-gray-500 text-sm">No saved connections yet.</div>
      ) : (
        <ul className="space-y-2">
          {connections.map((c) => (
            <li key={c._id} className="flex items-center gap-2">
              <span className="font-mono text-xs">{c.session}</span>
              <span className={`inline-block w-2 h-2 rounded-full ${statusColors[c.status] || 'bg-gray-400'}`}></span>
              <span className="text-xs text-gray-500">{c.status}</span>
              <button onClick={() => handleEdit(c)} className="ml-2 text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
              <button onClick={() => { setDeleteId(c._id); setDeleteOpen(true); }} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>Update the session name or secret for this connection.</DialogDescription>
          </DialogHeader>
          {editModel && (
            <form onSubmit={e => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
              <div>
                <Label htmlFor="edit-session">Session Name</Label>
                <Input id="edit-session" value={editModel.session} onChange={e => setEditModel((m: any) => ({ ...m, session: e.target.value }))} required />
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
      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this connection? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Channels: WhatsApp Session Wizard</h1>
      <ConnectionsList />
      <Stepper />
      <Card className="p-6 space-y-4">
        {step === 0 && (
          <form onSubmit={handleSessionDetails} className="space-y-4">
            <div>
              <Label htmlFor="session">Session Name</Label>
              <Input id="session" value={model.session} onChange={e => setModel(m => ({ ...m, session: e.target.value }))} placeholder="mySession" required />
              {errors.session && <span className="text-red-500 text-xs">Session is required</span>}
            </div>
            <div>
              <Label htmlFor="secret">Secret Key</Label>
              <Input id="secret" value={model.secret} onChange={e => setModel(m => ({ ...m, secret: e.target.value }))} placeholder="THISISMYSECURETOKEN" required type="password" />
              {errors.secret && <span className="text-red-500 text-xs">Secret is required</span>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit">Next</Button>
            </div>
          </form>
        )}
        {step === 1 && (
          <form onSubmit={handleGenerateToken} className="space-y-4">
            <div>
              <Label>Session</Label>
              <div className="font-mono text-xs break-all">{model.session}</div>
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
              <Label>Session</Label>
              <div className="font-mono text-xs break-all">{model.session}</div>
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
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-3 h-3 rounded-full ${statusColors[model.status] || 'bg-gray-400'}`}></span>
              <span className="font-mono text-sm">{model.status || 'Unknown'}</span>
            </div>
            {model.qr && (
              <div className="mt-4">
                <div className="mb-2">Scan this QR code in WhatsApp:</div>
                <img src={model.qr} alt="QR Code" className="w-48 h-48 border rounded" />
              </div>
            )}
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