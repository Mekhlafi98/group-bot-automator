import { useLocation, NavLink, useNavigate } from "react-router-dom";
import {
  Bot,
  Settings,
  Filter,
  Workflow,
  MessageSquare,
  History,
  Webhook,
  Users,
  LogOut,
  User,
  ChevronDown,
  Shield,
  UserCheck,
  Bell,
  AlertTriangle,
  Key
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    title: "Dashboard",
    url: "/",
    icon: Bot,
  },
  {
    title: "Groups",
    url: "/groups",
    icon: Users,
  },
  {
    title: "Channels",
    url: "/channels",
    icon: MessageSquare,
  },
  // {
  //   title: "Workflows",
  //   url: "/workflows",
  //   icon: Workflow,
  // },
  {
    title: "Filters",
    url: "/filters",
    icon: Filter,
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: User,
  },
  {
    title: "Webhooks",
    url: "/webhooks",
    icon: Webhook,
  },
  {
    title: "API Tokens",
    url: "/api-tokens",
    icon: Key,
  },
  {
    title: "Logs",
    url: "/logs",
    icon: History,
  },
  // {
  //   title: "Settings",
  //   url: "/settings",
  //   icon: Settings,
  // },
  {
    title: "Messaging",
    url: "/messaging",
    icon: MessageSquare,
  },
  // {
  //   title: "Alerts",
  //   url: "/alerts",
  //   icon: AlertTriangle,
  // },
  // {
  //   label: "System Status",
  //   to: "/system-status",
  //   icon: AlertTriangle,
  // },
  // Profile link removed from sidebar - accessible only via user dropdown
  // {
  //   title: "Profile",
  //   url: "/profile",
  //   icon: UserCheck,
  // },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { logout, isAuthenticated, isLoading, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't render sidebar if not authenticated, still loading, or user is not set
  if (!isAuthenticated || isLoading || !user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-gray-400";
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && "Bot Admin"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.url || item.to || item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url || item.to}
                      end={(item.url || item.to) === "/"}
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title || item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile Section */}
        <div className="mt-auto p-2">
          {collapsed ? (
            // Collapsed profile view
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getUserInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Expanded profile view
            <div className="space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-sidebar-accent/50"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user ? getUserInitials(user.email) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {user?.email || "User"}
                          </p>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(user?.isActive || false)}`} />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                            Admin
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    User Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}