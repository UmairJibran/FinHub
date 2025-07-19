import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AppLayout>
                {children}
            </AppLayout>
        </ThemeProvider>
    );
} 