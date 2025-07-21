import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Briefcase, 
  TrendingUp,
  Wallet,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
    {
      title: "Portfolios",
      href: "/portfolios",
      icon: Briefcase,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: TrendingUp,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: Wallet,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t z-50 lg:hidden">
      <div className="flex justify-around items-center h-16 px-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full rounded-lg transition-colors hover:bg-muted/50 active:bg-muted/70 min-h-[44px]",
                active ? "text-primary bg-muted/30" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}