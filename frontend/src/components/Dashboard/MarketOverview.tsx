import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWebSocket, PriceData } from '@/hooks/useWebSocket';
import { useMemo } from 'react';

interface MarketData {
  totalVolume24h: number;
  activePositions: number;
  topGainer: {
    symbol: string;
    change: number;
  };
  topLoser: {
    symbol: string;
    change: number;
  };
  systemStatus: 'online' | 'degraded' | 'offline';
  lastUpdate: Date;
}

export function MarketOverview() {
  const { prices, isConnected } = useWebSocket();

  // Calculate market data from real-time prices
  const marketData = useMemo((): MarketData => {
    if (prices.length === 0) {
      return {
        totalVolume24h: 0,
        activePositions: 0,
        topGainer: { symbol: 'N/A', change: 0 },
        topLoser: { symbol: 'N/A', change: 0 },
        systemStatus: isConnected ? 'online' : 'offline',
        lastUpdate: new Date(),
      };
    }

    // Find top gainer and loser
    const sortedByChange = [...prices].sort((a, b) => b.changePercent - a.changePercent);
    const topGainer = sortedByChange[0];
    const topLoser = sortedByChange[sortedByChange.length - 1];

    // Simulate volume and positions (in real app, this would come from contract)
    const totalVolume24h = prices.reduce((sum, price) => sum + (price.price * 1000), 0);
    const activePositions = Math.floor(prices.length * 50 + Math.random() * 100);

    return {
      totalVolume24h,
      activePositions,
      topGainer: {
        symbol: topGainer.symbol,
        change: topGainer.changePercent,
      },
      topLoser: {
        symbol: topLoser.symbol,
        change: topLoser.changePercent,
      },
      systemStatus: isConnected ? 'online' : 'offline',
      lastUpdate: new Date(),
    };
  }, [prices, isConnected]);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    return `$${(volume / 1000).toFixed(0)}K`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-status-online';
      case 'degraded': return 'text-status-warning';
      case 'offline': return 'text-status-offline';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 24h Volume */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            24h Volume
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {formatVolume(marketData.totalVolume24h)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all markets
          </p>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Positions
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {marketData.activePositions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Platform-wide
          </p>
        </CardContent>
      </Card>

      {/* Top Gainer */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Gainer
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {marketData.topGainer.symbol}
          </div>
          <p className="text-xs font-mono text-success">
            +{marketData.topGainer.change.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="trading-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            System Status
          </CardTitle>
          <Zap className={cn("h-4 w-4", getStatusColor(marketData.systemStatus))} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge
              variant={marketData.systemStatus === 'online' ? 'default' : 'secondary'}
              className={cn(
                marketData.systemStatus === 'online' && "bg-success text-success-foreground"
              )}
            >
              {marketData.systemStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last update: {marketData.lastUpdate.toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}