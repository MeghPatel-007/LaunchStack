import { MetricsOverview } from "@/components/dashboard/metrics-overview"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { TopProducts } from "@/components/dashboard/top-products"
import { CustomerInsights } from "@/components/dashboard/customer-insights"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RevenueBreakdown } from "@/components/dashboard/revenue-breakdown"

export default function DashboardHome() {
  return (
    <div className="flex flex-col flex-1 gap-6 px-6 pt-0">
      {/* Enhanced Header */}

      <div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Business Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your business performance and key metrics in real-time
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex flex-col @container/main gap-6">
        {/* Top Row - Key Metrics */}

        <MetricsOverview />

        {/* Second Row - Charts in 6-6 columns */}
        <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
          <SalesChart />
          <RevenueBreakdown />
        </div>

        {/* Third Row - Two Column Layout */}
        <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
          <RecentTransactions />
          <TopProducts />
        </div>

        {/* Fourth Row - Customer Insights and Team Performance */}
        <CustomerInsights />
      </div>
    </div>
  )
}
