import { Github, Menu, User, LogOut, BarChart3, Briefcase } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";

export function Header(): JSX.Element {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
    const isAuthenticated = !!user;
    const location = useLocation();
    
    // Check if we're on a page that shows the sidebar (which has its own logout)
    const shouldShowSidebar = isAuthenticated && (
        location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/portfolios') ||
        location.pathname.startsWith('/asset-prices') ||
        location.pathname.startsWith('/analytics') ||
        location.pathname.startsWith('/transactions') ||
        location.pathname.startsWith('/settings')
    );

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            // Logout error
        }
    };

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo and Desktop Navigation */}
                <div className="flex gap-6 items-center">
                    <Link to="/" className="text-xl font-bold">
                        FinHub
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link 
                            to="/calculators" 
                            className={`text-sm font-medium transition-colors hover:text-primary ${
                                isActive('/calculators') ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            Calculators
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    className={`text-sm font-medium transition-colors hover:text-primary ${
                                        isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/portfolios" 
                                    className={`text-sm font-medium transition-colors hover:text-primary ${
                                        isActive('/portfolios') ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    Portfolios
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            {!shouldShowSidebar && (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4" />
                                        <span className="text-muted-foreground">
                                            {user?.email || 'User'}
                                        </span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleLogout}
                                        className="gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <Button asChild variant="default" size="sm">
                            <Link to="/auth/login">Login</Link>
                        </Button>
                    )}
                    
                    <Button variant="ghost" size="icon" asChild>
                        <a href="https://github.com/UmairJibran/FinTools-Hub" target="_blank" rel="noopener noreferrer">
                            <Github className="h-5 w-5" />
                        </a>
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <nav className="container py-4 space-y-2">
                        <Link 
                            to="/calculators" 
                            className={`block py-3 px-2 text-base font-medium transition-colors hover:text-primary rounded-md hover:bg-muted/50 ${
                                isActive('/calculators') ? 'text-primary bg-muted/30' : 'text-muted-foreground'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Calculators
                        </Link>
                        
                        {isAuthenticated ? (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    className={`block py-3 px-2 text-base font-medium transition-colors hover:text-primary rounded-md hover:bg-muted/50 ${
                                        isActive('/dashboard') ? 'text-primary bg-muted/30' : 'text-muted-foreground'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Dashboard
                                    </div>
                                </Link>
                                <Link 
                                    to="/portfolios" 
                                    className={`block py-3 px-2 text-base font-medium transition-colors hover:text-primary rounded-md hover:bg-muted/50 ${
                                        isActive('/portfolios') ? 'text-primary bg-muted/30' : 'text-muted-foreground'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-5 w-5" />
                                        Portfolios
                                    </div>
                                </Link>
                                
                                {!shouldShowSidebar && (
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <User className="h-4 w-4" />
                                            {user?.email || 'User'}
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="gap-2 w-full justify-start"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="pt-4 border-t">
                                <Button 
                                    asChild 
                                    variant="default" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Link to="/auth/login">Login</Link>
                                </Button>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t">
                            <a 
                                href="https://github.com/UmairJibran/FinTools-Hub" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
} 