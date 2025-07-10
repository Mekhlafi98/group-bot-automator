import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/api';
import { 
    Key, 
    Copy, 
    Check, 
    Plus, 
    Trash2, 
    Eye, 
    EyeOff, 
    Shield, 
    Clock, 
    AlertTriangle,
    User,
    Calendar,
    Activity,
    ExternalLink
} from 'lucide-react';

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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        api.get('/auth/me').then(res => setProfile(res.data));
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        const res = await api.get('/tokens');
        setTokens(res.data);
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/tokens', { label: newLabel });
            setNewToken(res.data);
            setNewLabel('');
            setIsCreateDialogOpen(false);
            fetchTokens();
            toast({ 
                title: 'Token Created Successfully', 
                description: 'Your API token has been generated. Copy it now as it won\'t be shown again.',
                variant: 'default'
            });
        } catch (err: any) {
            toast({ 
                title: 'Error', 
                description: err.response?.data?.message || 'Failed to create token', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        setLoading(true);
        try {
            await api.delete(`/tokens/${id}`);
            fetchTokens();
            toast({ 
                title: 'Token Revoked', 
                description: 'The API token has been successfully revoked.',
                variant: 'default'
            });
        } catch (err: any) {
            toast({ 
                title: 'Error', 
                description: err.response?.data?.message || 'Failed to revoke token', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedToken(text);
            toast({ 
                title: 'Copied!', 
                description: 'Token copied to clipboard',
                variant: 'default'
            });
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (err) {
            toast({ 
                title: 'Error', 
                description: 'Failed to copy token', 
                variant: 'destructive' 
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const activeTokens = tokens.filter(token => !token.revoked);
    const revokedTokens = tokens.filter(token => token.revoked);

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* User Profile Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        User Profile
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {profile ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Activity className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Email</p>
                                    <p className="text-lg font-semibold">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                                    <p className="text-lg font-semibold">{formatDate(profile.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                </div>
                        <div>
                                    <p className="text-sm font-medium text-gray-600">Last Login</p>
                                    <p className="text-lg font-semibold">{formatDate(profile.lastLoginAt)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* API Tokens Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Key className="h-6 w-6 text-indigo-600" />
                                </div>
                                API Access Tokens
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Manage your API tokens for external integrations and automation
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                    <Plus className="h-4 w-4" />
                                    Create Token
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Create New API Token
                                    </DialogTitle>
                                    <DialogDescription>
                                        Generate a new API token for external integrations. Keep it secure and never share it publicly.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateToken} className="space-y-4">
                                    <div>
                                        <Label htmlFor="token-label">Token Label</Label>
                        <Input
                                            id="token-label"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                                            placeholder="e.g., My Integration Script"
                            required
                            disabled={loading}
                                            className="mt-1"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Give your token a descriptive name to help you identify its purpose
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading || !newLabel.trim()}>
                                            {loading ? 'Creating...' : 'Create Token'}
                                        </Button>
                                    </DialogFooter>
                    </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* New Token Display */}
                    {newToken && (
                        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <h3 className="font-semibold text-amber-800">Important: Copy Your Token Now</h3>
                            </div>
                            <p className="text-sm text-amber-700 mb-4">
                                This token will only be shown once. Make sure to copy it to a secure location.
                            </p>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-sm font-medium">Your API Token</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowToken(!showToken)}
                                        className="h-6 w-6 p-0"
                                    >
                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-3 bg-white border border-amber-300 rounded-lg font-mono text-sm break-all">
                                        {showToken ? newToken.token : '•'.repeat(64)}
                                    </div>
                                    <Button
                                        onClick={() => copyToClipboard(newToken.token!)}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        {copiedToken === newToken.token ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                        {copiedToken === newToken.token ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">How to use this token:</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <p>• Include it in the <code className="bg-blue-100 px-1 rounded">x-api-token</code> header</p>
                                    <p>• Base URL: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/api/external</code></p>
                                    <p>• See <a href="/docs/api" className="underline hover:text-blue-900">API documentation</a> for examples</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Tokens */}
                    {activeTokens.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Active Tokens ({activeTokens.length})
                            </h3>
                            <div className="space-y-3">
                                {activeTokens.map(token => (
                                    <div key={token._id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Key className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{token.label}</p>
                                                <p className="text-sm text-gray-600">Created {formatDate(token.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-green-100 text-green-800">
                                                Active
                                            </Badge>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Revoke API Token</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to revoke the token "{token.label}"? 
                                                            This action cannot be undone and any applications using this token will lose access.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleRevoke(token._id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Revoke Token
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Revoked Tokens */}
                    {revokedTokens.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                Revoked Tokens ({revokedTokens.length})
                            </h3>
                            <div className="space-y-3">
                                {revokedTokens.map(token => (
                                    <div key={token._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-75">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                <Key className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-600">{token.label}</p>
                                                <p className="text-sm text-gray-500">Created {formatDate(token.createdAt)}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">Revoked</Badge>
                            </div>
                        ))}
                    </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {tokens.length === 0 && (
                        <div className="text-center py-12">
                            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Key className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No API tokens yet</h3>
                            <p className="text-gray-600 mb-6">
                                Create your first API token to start integrating with external applications
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Token
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile; 