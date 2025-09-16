import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PortfolioMetrics {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  totalCollateral: number;
  availableBalance: number;
  marginRatio: number;
}

// Mock data
const portfolioData: PortfolioMetrics = {
  totalValue: 3456.78,
  pnl: 234.56,
  pnlPercent: 7.29,
  totalCollateral: 890.45,
  availableBalance: 359.99,
  marginRatio: 0.65,
};

export function PortfolioSummary() {
  const isProfitable = portfolioData.pnl >= 0;
  const isHealthyMargin = portfolioData.marginRatio < 0.8;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Portfolio Value */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Portfolio Value
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            ${portfolioData.totalValue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total position value
          </p>
        </CardContent>
      </Card>

      {/* P&L */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Unrealized P&L
          </CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold font-mono",
            isProfitable ? "text-success" : "text-danger"
          )}>
            {isProfitable ? '+' : ''}${portfolioData.pnl.toFixed(2)}
          </div>
          <p className={cn(
            "text-xs font-mono",
            isProfitable ? "text-success" : "text-danger"
          )}>
            {isProfitable ? '+' : ''}{portfolioData.pnlPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* Collateral */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Used Collateral
          </CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {portfolioData.totalCollateral.toFixed(2)} XLM
          </div>
          <p className="text-xs text-muted-foreground">
            Locked in positions
          </p>
        </CardContent>
      </Card>

      {/* Margin Ratio */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margin Ratio
          </CardTitle>
          <div className={cn(
            "h-2 w-2 rounded-full",
            isHealthyMargin ? "bg-success" : "bg-warning"
          )} />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold font-mono",
            isHealthyMargin ? "text-foreground" : "text-warning"
          )}>
            {(portfolioData.marginRatio * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {portfolioData.availableBalance.toFixed(2)} XLM available
          </p>
        </CardContent>
      </Card>
    </div>
  );
}