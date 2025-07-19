import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Briefcase, 
  PlusCircle, 
  TrendingUp,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      description: "Overview of all portfolios"
    },
    {
      title: "Portfolios",
      href: "/portfolios",
      icon: Briefcase,
      description: "Manage your investment portfolios"
    },
    {
      title: "Add Position",
      href: "/portfolios/add-position",
      icon: PlusCircle,
      description: "Add new investment position"
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: TrendingUp,
      description: "Performance analytics and insights"
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: Wallet,
      description: "Transaction history and records"
    }
  ];

  return (
    <div className={cn(
      "relative flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-2 border-t">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground",
            isActive("/settings") && "bg-accent text-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );
}

// Mobile sidebar overlay
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-background border-r z-50 lg:hidden">
        <Sidebar />
      </div>
    </>
  );
}