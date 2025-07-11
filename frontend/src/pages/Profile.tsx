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
    User,
    Calendar,
    Activity,
    Edit,
    Lock,
    Eye,
    EyeOff,
    Save,
    X,
    Check,
    Shield,
    LogOut,
    Settings,
    Mail,
    Clock,
    AlertTriangle,
    Smartphone,
    Monitor,
    Globe,
    Key,
    Bell
} from 'lucide-react';

interface UserProfile {
    _id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLoginAt: string;
    isActive: boolean;
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isLogoutAllDialogOpen, setIsLogoutAllDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        email: '',
        name: ''
    });
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setProfile(response.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load profile',
                variant: 'destructive'
            });
        }
    };

    const handleEditProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/auth/profile', editFormData);
            setProfile(response.data);
            setIsEditDialogOpen(false);
            toast({ 
                title: 'Success',
                description: 'Profile updated successfully',
                variant: 'default'
            });
        } catch (error: any) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to update profile',
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                variant: 'destructive'
            });
            return;
        }

        if (passwordFormData.newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'New password must be at least 6 characters long',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordFormData.currentPassword,
                newPassword: passwordFormData.newPassword
            });
            setIsPasswordDialogOpen(false);
            setPasswordFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            toast({ 
                title: 'Success',
                description: 'Password changed successfully',
                variant: 'default'
            });
        } catch (error: any) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to change password',
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAllDevices = async () => {
        setLoading(true);
        try {
            const response = await api.post('/auth/logout-all-devices');

            // Update local storage with new refresh token
            if (response.data.newRefreshToken) {
                localStorage.setItem('refreshToken', response.data.newRefreshToken);
            }

            setIsLogoutAllDialogOpen(false);
            toast({ 
                title: 'Success',
                description: 'Successfully logged out from all devices',
                variant: 'default'
            });
        } catch (error: any) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to logout from all devices',
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = () => {
        if (profile) {
            setEditFormData({
                email: profile.email,
                name: profile.name || ''
            });
        }
        setIsEditDialogOpen(true);
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

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return formatDate(dateString);
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600 mt-2">Manage your account information and security preferences</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={openEditDialog}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                    </Button>
                    <Button
                        onClick={() => setIsPasswordDialogOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        <Lock className="h-4 w-4" />
                        Change Password
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Information Card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Your basic account details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        Email Address
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">{profile.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <User className="h-4 w-4" />
                                        Full Name
                            </div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {profile.name || 'Not set'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        Member Since
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">{formatDate(profile.createdAt)}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        Last Login
                            </div>
                                    <p className="text-lg font-semibold text-gray-900">{getTimeAgo(profile.lastLoginAt)}</p>
                                </div>
                            </div>
                </CardContent>
            </Card>

                    {/* Account Status Card */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                Account Status
                            </CardTitle>
                            <CardDescription>
                                Current status and security information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Shield className="h-5 w-5 text-green-600" />
                        </div>
                                    <div>
                                        <p className="font-medium text-green-900">Account Status</p>
                                        <p className="text-sm text-green-700">
                                            {profile.isActive ? "Your account is active and secure" : "Your account is currently inactive"}
                                        </p>
                                    </div>
                    </div>
                                <Badge variant={profile.isActive ? "default" : "secondary"} className="bg-green-100 text-green-800">
                                    {profile.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Security & Actions Sidebar */}
                <div className="space-y-6">
                    {/* Security Actions */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Shield className="h-5 w-5 text-red-600" />
                                </div>
                                Security Actions
                            </CardTitle>
                            <CardDescription>
                                Manage your account security
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                    <Button
                                onClick={() => setIsPasswordDialogOpen(true)}
                                variant="outline"
                                className="w-full justify-start gap-3 h-12"
                            >
                                <Lock className="h-4 w-4" />
                                <div className="text-left">
                                    <div className="font-medium">Change Password</div>
                                    <div className="text-xs text-gray-500">Update your login credentials</div>
                                </div>
                            </Button>

                            <AlertDialog open={isLogoutAllDialogOpen} onOpenChange={setIsLogoutAllDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-3 h-12 border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <div className="text-left">
                                            <div className="font-medium">Logout All Devices</div>
                                            <div className="text-xs text-gray-500">Sign out from all sessions</div>
                                        </div>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            Logout from All Devices
                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                            This action will sign you out from all devices and browsers where you're currently logged in.
                                            You'll need to log in again on any device you want to use.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                            onClick={handleLogoutAllDevices}
                                                            className="bg-red-600 hover:bg-red-700"
                                            disabled={loading}
                                                        >
                                            {loading ? 'Processing...' : 'Logout All Devices'}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                </div>
                                Account Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-900">Account Age</span>
                                </div>
                                <span className="text-sm font-semibold text-purple-700">
                                    {Math.floor((new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                                        </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Last Activity</span>
                                    </div>
                                <span className="text-sm font-semibold text-blue-700">
                                    {getTimeAgo(profile.lastLoginAt)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Profile
                        </DialogTitle>
                        <DialogDescription>
                            Update your account information
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditProfile} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                placeholder="Enter your name"
                                disabled={loading}
                            />
                                            </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </DialogTitle>
                        <DialogDescription>
                            Update your password to keep your account secure
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                                            <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordFormData.currentPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                    </div>
                        </div>
                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordFormData.newPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Password must be at least 6 characters long
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordFormData.confirmPassword}
                                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile; 