import { PriceTicker } from '@/components/Trading/PriceTicker';
import { MarketOverview } from '@/components/Dashboard/MarketOverview';
import { TradingPanel } from '@/components/Trading/TradingPanel';
import { PortfolioSummary } from '@/components/Portfolio/PortfolioSummary';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Price Ticker */}
      <PriceTicker />
      
      {/* Market Overview */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Market Overview</h2>
        <MarketOverview />
      </div>
      
      {/* Portfolio Summary */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Portfolio Summary</h2>
        <PortfolioSummary />
      </div>
      
      {/* Quick Trading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Trade</h2>
          <TradingPanel />
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="trading-panel h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Recent trades and market movements will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}