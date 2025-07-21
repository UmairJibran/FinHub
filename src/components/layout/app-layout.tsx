import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import { Sidebar, MobileSidebar } from "./sidebar";
import { BottomNavigation } from "./bottom-navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const location = useLocation();
  
  // Determine if we should show the sidebar
  const shouldShowSidebar = isAuthenticated && (
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portfolios') ||
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/transactions') ||
    location.pathname.startsWith('/settings')
  );

  // Determine if we should show the bottom navigation
  const shouldShowBottomNav = isAuthenticated && (
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portfolios') ||
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/transactions') ||
    location.pathname.startsWith('/settings')
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {shouldShowSidebar && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        
        {/* Mobile Sidebar */}
        {shouldShowSidebar && (
          <MobileSidebar 
            isOpen={isMobileSidebarOpen} 
            onClose={() => setIsMobileSidebarOpen(false)} 
          />
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile sidebar toggle for portfolio pages - only show if no bottom nav */}
          {shouldShowSidebar && !shouldShowBottomNav && (
            <div className="lg:hidden border-b p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="gap-2"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
            </div>
          )}
          
          {/* Page content */}
          <main className={`flex-1 ${shouldShowBottomNav ? 'pb-24' : 'pb-4'} lg:pb-0`}>
            {children}
          </main>
        </div>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      {shouldShowBottomNav && <BottomNavigation />}
      
      <Footer className="hidden lg:block" />
    </div>
  );
}

// Layout wrapper for different page types
interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageLayout({ children, title, description, className = "" }: PageLayoutProps) {
  return (
    <div className={`container mx-auto px-4 py-6 pb-8 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Specialized layout for dashboard pages
export function DashboardLayout({ children, title, description }: PageLayoutProps) {
  return (
    <PageLayout 
      title={title} 
      description={description}
      className="max-w-7xl"
    >
      {children}
    </PageLayout>
  );
}

// Specialized layout for calculator pages (public)
export function CalculatorLayout({ children, title, description }: PageLayoutProps) {
  return (
    <PageLayout 
      title={title} 
      description={description}
      className="max-w-4xl"
    >
      {children}
    </PageLayout>
  );
}