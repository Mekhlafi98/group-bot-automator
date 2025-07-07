import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/api';

interface UserProfile {
    email: string;
    createdAt: string;
    lastLoginAt: string;
}

interface Token {
    _id: string;
    label: string;
    createdAt: string;
    revoked: boolean;
    token?: string; // Only present on creation
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [newToken, setNewToken] = useState<Token | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        api.get('/api/auth/me').then(res => setProfile(res.data));
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        const res = await api.get('/api/tokens');
        setTokens(res.data);
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/api/tokens', { label: newLabel });
            setNewToken(res.data);
            setNewLabel('');
            fetchTokens();
            toast({ title: 'Token created', description: 'Copy your token now. It will not be shown again.' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create token', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        setLoading(true);
        try {
            await api.delete(`/api/tokens/${id}`);
            fetchTokens();
            toast({ title: 'Token revoked' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to revoke token', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    {profile ? (
                        <div>
                            <div className="mb-2"><b>Email:</b> {profile.email}</div>
                            <div className="mb-2"><b>Created:</b> {new Date(profile.createdAt).toLocaleString()}</div>
                            <div className="mb-2"><b>Last Login:</b> {new Date(profile.lastLoginAt).toLocaleString()}</div>
                        </div>
                    ) : (
                        <div>Loading profile...</div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>API Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateToken} className="flex gap-2 mb-4">
                        <Input
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            placeholder="Token label (e.g. My Script)"
                            required
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading || !newLabel.trim()}>Create Token</Button>
                    </form>
                    {newToken && (
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <b>Copy your new token now:</b>
                            <div className="font-mono break-all p-2 bg-yellow-100 rounded mt-1">{newToken.token}</div>
                            <div className="text-xs text-muted-foreground mt-1">This token will not be shown again.</div>
                        </div>
                    )}
                    <div className="space-y-2">
                        {tokens.length === 0 && <div>No tokens created yet.</div>}
                        {tokens.map(token => (
                            <div key={token._id} className="flex items-center gap-2 p-2 border rounded">
                                <span className="font-mono text-xs">{token.label}</span>
                                <Badge variant={token.revoked ? 'secondary' : 'default'}>{token.revoked ? 'Revoked' : 'Active'}</Badge>
                                <span className="text-xs text-muted-foreground">Created: {new Date(token.createdAt).toLocaleString()}</span>
                                {!token.revoked && (
                                    <Button size="sm" variant="outline" onClick={() => handleRevoke(token._id)} disabled={loading}>Revoke</Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile; 