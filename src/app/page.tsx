import { Calculator, ArrowRight, TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Smart Financial Planning
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Smart Financial Tools for Better Decisions
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Access powerful calculators and portfolio tracking tools to plan your financial future with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/calculators">
                  <Calculator className="mr-2 h-5 w-5" />
                  Explore Calculators
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/portfolios">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Track Portfolio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need for financial planning
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to help you make informed financial decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Calculator Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Financial Calculators</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Advanced calculators for SIP, SWP, Zakat, and share averaging to optimize your investments.
                </p>
                <Button asChild variant="ghost" className="group-hover:text-primary p-0">
                  <Link to="/calculators" className="flex items-center">
                    Explore Tools <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Portfolio Tracker Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Portfolio Tracker</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Track investments across stocks, crypto, mutual funds, and more with real-time analytics.
                </p>
                <Button asChild variant="ghost" className="group-hover:text-primary p-0">
                  <Link to="/portfolios" className="flex items-center">
                    Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1 md:col-span-2 lg:col-span-1">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Analytics</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Comprehensive dashboards with insights, performance metrics, and allocation analysis.
                </p>
                <Button asChild variant="ghost" className="group-hover:text-primary p-0">
                  <Link to="/dashboard" className="flex items-center">
                    View Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Secure & Private
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Your financial data is safe with us
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Built with security-first principles, your sensitive financial information is encrypted and protected.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Bank-level Security</h3>
                <p className="text-sm text-muted-foreground">End-to-end encryption for all your data</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Optimized for speed and performance</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">Live data synchronization</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
