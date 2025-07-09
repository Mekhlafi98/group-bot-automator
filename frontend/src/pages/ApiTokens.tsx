import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    AlertTriangle,
    ExternalLink,
    Code,
    BookOpen,
    Zap,
    Settings,
    RefreshCw
} from 'lucide-react';

interface Token {
    _id: string;
    label: string;
    createdAt: string;
    revoked: boolean;
    token?: string; // Only present on creation
}

const ApiTokens = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [newToken, setNewToken] = useState<Token | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const { toast } = useToast();

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            const res = await api.get('/tokens');
            setTokens(res.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch tokens',
                variant: 'destructive'
            });
        }
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
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">API Tokens</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your API tokens for external integrations and automation
                    </p>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">API Documentation</h3>
                                <p className="text-sm text-gray-600">Learn how to use your tokens</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Code className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Code Examples</h3>
                                <p className="text-sm text-gray-600">Ready-to-use code snippets</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Zap className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Test Endpoints</h3>
                                <p className="text-sm text-gray-600">Verify your integration</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* New Token Display */}
            {newToken && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardContent className="p-6">
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
                    </CardContent>
                </Card>
            )}

            {/* Tokens List */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Key className="h-5 w-5 text-indigo-600" />
                        </div>
                        Your API Tokens
                    </CardTitle>
                    <CardDescription>
                        Manage and monitor your API tokens
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active" className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Active ({activeTokens.length})
                            </TabsTrigger>
                            <TabsTrigger value="revoked" className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                Revoked ({revokedTokens.length})
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="active" className="mt-6">
                            {activeTokens.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Key className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active tokens</h3>
                                    <p className="text-gray-600 mb-6">
                                        Create your first API token to start integrating with external applications
                                    </p>
                                    <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create Your First Token
                                    </Button>
                                </div>
                            ) : (
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
                            )}
                        </TabsContent>
                        
                        <TabsContent value="revoked" className="mt-6">
                            {revokedTokens.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Settings className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No revoked tokens</h3>
                                    <p className="text-gray-600">
                                        All your tokens are currently active
                                    </p>
                                </div>
                            ) : (
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
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApiTokens; 