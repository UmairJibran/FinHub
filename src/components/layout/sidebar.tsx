import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  TrendingUp,
  Wallet,
  Settings,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user, profile } = useAuth();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Error signing out
    }
  };

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview',
    },
    {
      title: 'Portfolios',
      href: '/portfolios',
      icon: Briefcase,
      description: 'Manage portfolios',
    },
    {
      title: 'Asset Prices',
      href: '/asset-prices',
      icon: DollarSign,
      description: 'Update prices',
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      description: 'Performance',
    },
    {
      title: 'Transactions',
      href: '/transactions',
      icon: Wallet,
      description: 'History',
    },
  ];

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out shadow-lg z-[100]',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              Portfolio
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                )}
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.description}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
        {/* Settings */}
        <div className="p-3">
          <Link
            to="/settings"
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive('/settings')
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings
              className={cn(
                'h-5 w-5 flex-shrink-0 transition-colors',
                isActive('/settings')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              )}
            />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate">Settings</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Preferences
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full justify-start gap-3 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          )}
        </div>
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
  const location = useLocation();
  const { signOut, user, profile } = useAuth();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      // Error signing out
    }
  };

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview of all portfolios',
    },
    {
      title: 'Portfolios',
      href: '/portfolios',
      icon: Briefcase,
      description: 'Manage your investment portfolios',
    },
    {
      title: 'Asset Prices',
      href: '/asset-prices',
      icon: DollarSign,
      description: 'Update current asset prices',
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      description: 'Performance analytics and insights',
    },
    {
      title: 'Transactions',
      href: '/transactions',
      icon: Wallet,
      description: 'Transaction history and records',
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 lg:hidden transform transition-transform shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Portfolio
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Investment Tracker
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200',
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 flex-shrink-0 transition-colors',
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    )}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.title}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
            {/* Settings */}
            <div className="p-4">
              <Link
                to="/settings"
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200',
                  isActive('/settings')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Settings
                  className={cn(
                    'h-6 w-6 flex-shrink-0 transition-colors',
                    isActive('/settings')
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Settings</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    Account preferences
                  </span>
                </div>
              </Link>
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-medium text-slate-900 dark:text-white truncate">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-4 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-4 py-3"
              >
                <LogOut className="h-6 w-6 flex-shrink-0" />
                <span className="text-base font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
