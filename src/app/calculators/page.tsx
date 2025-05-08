import { ArrowLeft, Calculator, Coins } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CalculatorsPage(): JSX.Element {
  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Financial Calculators</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="relative p-6 border rounded-lg hover:border-primary transition-colors">
          <Calculator className="w-12 h-12 mb-4" />
          <h2 className="text-lg font-semibold mb-2">SIP to SWP Calculator</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Plan your investment journey from SIP to SWP with our advanced calculator
          </p>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/calculators/sip-swp">
                Try Calculator
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative p-6 border rounded-lg hover:border-primary transition-colors">
          <Coins className="w-12 h-12 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Zakat Calculator</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Calculate your annual Zakat obligation with our easy-to-use calculator
          </p>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/calculators/zakat">
                Try Calculator
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative p-6 border rounded-lg hover:border-primary transition-colors">
          <Calculator className="w-12 h-12 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Share Averaging Calculator</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Calculate how many shares to buy to reach your target average price.
          </p>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/calculators/share-averaging">
                Try Calculator
              </Link>
            </Button>
          </div>
        </div>
        {/* More calculators to be added */}
      </div>
    </div>
  );
} 