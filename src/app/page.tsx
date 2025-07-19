import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export default function HomePage(): JSX.Element {
  return (
    <div className="py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">
            Smart Financial Tools for Better Decisions
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Access powerful calculators and portfolio tracking tools to plan
            your financial future.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/calculators"
              className="group p-6 border rounded-lg hover:border-primary"
            >
              <Calculator className="w-12 h-12 mb-4 mx-auto" />
              <h2 className="text-lg font-semibold mb-2">Calculators</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Financial calculators for investment planning
              </p>
              <Button variant="ghost" className="group-hover:text-primary">
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              to="/portfolios"
              className="group p-6 border rounded-lg hover:border-primary"
            >
              <TrendingUp className="w-12 h-12 mb-4 mx-auto" />
              <h2 className="text-lg font-semibold mb-2">Portfolio Tracker</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Track your investments across different asset classes
              </p>
              <Button variant="ghost" className="group-hover:text-primary">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
