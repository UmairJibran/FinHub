import { ArrowLeft, Calculator, Coins, TrendingUp, BarChart3, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CalculatorsPage(): JSX.Element {
  const calculators = [
    {
      id: 'sip-swp',
      title: 'SIP to SWP Calculator',
      description: 'Plan your investment journey from SIP to SWP with our advanced calculator that helps you transition from accumulation to withdrawal phase.',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      href: '/calculators/sip-swp',
      features: ['SIP Planning', 'SWP Strategy', 'Goal-based Investing']
    },
    {
      id: 'zakat',
      title: 'Zakat Calculator',
      description: 'Calculate your annual Zakat obligation with our comprehensive calculator that covers all asset types and provides accurate calculations.',
      icon: Coins,
      gradient: 'from-green-500 to-green-600',
      href: '/calculators/zakat',
      features: ['Asset Coverage', 'Nisab Calculation', 'Annual Planning']
    },
    {
      id: 'share-averaging',
      title: 'Share Averaging Calculator',
      description: 'Calculate how many shares to buy to reach your target average price and optimize your investment cost basis.',
      icon: Target,
      gradient: 'from-purple-500 to-purple-600',
      href: '/calculators/share-averaging',
      features: ['Cost Averaging', 'Target Price', 'Investment Optimization']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="hover:bg-white/80 dark:hover:bg-gray-800/80">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Financial Calculators
            </h1>
            <p className="text-muted-foreground mt-2">
              Powerful tools to help you make informed financial decisions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Calculators Available</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">Fast</p>
                <p className="text-sm text-muted-foreground">Instant Calculations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">Free</p>
                <p className="text-sm text-muted-foreground">No Hidden Costs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {calculators.map((calc) => {
            const IconComponent = calc.icon;
            return (
              <Card key={calc.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${calc.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {calc.title}
                  </h2>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {calc.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {calc.features.map((feature) => (
                      <span 
                        key={feature}
                        className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <Button asChild className="w-full group-hover:shadow-lg transition-shadow">
                      <Link to={calc.href}>
                        Try Calculator
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">More Calculators Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              We're working on additional financial calculators to help you with all aspects of financial planning.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">EMI Calculator</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">Tax Calculator</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">Retirement Planner</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">Loan Calculator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
