import { Github } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";

export function Header(): JSX.Element {
    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex gap-6 items-center">
                    <Link to="/" className="text-xl font-bold">
                        FinHub
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link to="/calculators" className="text-sm font-medium">
                            Calculators
                        </Link>
                        <Link to="/portfolios" className="text-sm font-medium">
                            Portfolio Tracker
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <a href="https://github.com/UmairJibran/FinTools-Hub" target="_blank" rel="noopener noreferrer">
                            <Github className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
} 