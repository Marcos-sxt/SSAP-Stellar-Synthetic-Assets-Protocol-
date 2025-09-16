import { PortfolioSummary } from '@/components/Portfolio/PortfolioSummary';
import { PositionsList } from '@/components/Portfolio/PositionsList';

export function Portfolio() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Portfolio</h1>
        <p className="text-muted-foreground">Manage your positions and track performance</p>
      </div>
      
      {/* Portfolio Summary */}
      <PortfolioSummary />
      
      {/* Active Positions */}
      <PositionsList />
    </div>
  );
}