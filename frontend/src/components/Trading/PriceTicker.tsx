import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket, PriceData } from '@/hooks/useWebSocket';

export function PriceTicker() {
  const { prices, isConnected, error, reconnect } = useWebSocket();
  
  console.log('🎯 PriceTicker - prices length:', prices.length);
  console.log('🎯 PriceTicker - prices:', prices);
  console.log('🎯 PriceTicker - first price:', prices[0]);
  console.log('🎯 PriceTicker - prices type:', typeof prices);
  console.log('🎯 PriceTicker - isArray:', Array.isArray(prices));

  return (
    <div className="bg-trading-surface border-b border-trading-border">
      {/* Connection Status */}
      <div className="flex items-center justify-between px-6 py-2 bg-muted/50">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-danger" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {error && (
            <span className="text-xs text-danger ml-2">
              {error}
            </span>
          )}
        </div>
        {!isConnected && (
          <button
            onClick={reconnect}
            className="text-xs text-primary hover:underline"
          >
            Reconnect
          </button>
        )}
      </div>
      
      <div className="overflow-hidden">
        <div className="flex animate-pulse">
          <div className="flex space-x-8 py-3 px-6">
            {prices && prices.length > 0 ? (
              prices.map((asset, index) => {
                console.log(`🎯 Rendering asset ${index}:`, asset);
                return <AssetTickerItem key={asset.symbol || index} asset={asset} />;
              })
            ) : (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">
                  {prices === null ? 'Loading prices...' : 'No prices available'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetTickerItem({ asset }: { asset: PriceData }) {
  console.log('🎯 AssetTickerItem - asset:', asset);
  console.log('🎯 AssetTickerItem - asset.symbol:', asset.symbol);
  console.log('🎯 AssetTickerItem - asset.price:', asset.price);
  console.log('🎯 AssetTickerItem - asset.change:', asset.change);
  console.log('🎯 AssetTickerItem - asset.changePercent:', asset.changePercent);
  
  const isPositive = asset.change >= 0;
  
  return (
    <div className="flex items-center space-x-3 min-w-fit">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-foreground">{asset.symbol}</span>
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-success" />
          ) : (
            <TrendingDown className="w-3 h-3 text-danger" />
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-mono font-medium text-foreground">
          ${asset.price.toFixed(2)}
        </div>
        <div className={cn(
          "text-xs font-mono",
          isPositive ? "text-success" : "text-danger"
        )}>
          {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </div>
      </div>
      
      <div className="w-px h-6 bg-trading-border" />
    </div>
  );
}