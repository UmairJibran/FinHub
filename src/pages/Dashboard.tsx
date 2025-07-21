import { DashboardLayout } from "@/components/layout/app-layout";
import { DashboardOverview } from "@/modules/portfolio-tracker/components/DashboardOverview";
import { AssetAllocationChart } from "@/modules/portfolio-tracker/components/AssetAllocationChart";
import { TransactionHistory } from "@/modules/portfolio-tracker/components/TransactionHistory";
import { PerformanceChart } from "@/modules/portfolio-tracker/components/PerformanceChart";

export default function Dashboard() {
  return (
    <DashboardLayout
      title="Portfolio Dashboard"
      description="Track your investments and monitor performance across all portfolios"
    >
      <div className="space-y-6">
        {/* Main dashboard overview with key metrics */}
        <DashboardOverview />
        
        {/* Charts and analytics section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocationChart />
          <PerformanceChart />
        </div>
        
        {/* Transaction history with filtering */}
        <TransactionHistory limit={10} showFilters={true} />
      </div>
    </DashboardLayout>
  );
}
