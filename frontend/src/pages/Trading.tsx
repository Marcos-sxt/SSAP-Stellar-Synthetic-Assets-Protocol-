import { TradingPanel } from '@/components/Trading/TradingPanel';
import { PriceTicker } from '@/components/Trading/PriceTicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp } from 'lucide-react';

export function Trading() {
  return (
    <div className="space-y-6">
      {/* Price Ticker */}
      <PriceTicker />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <TradingPanel />
        </div>
        
        {/* Chart Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="trading-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span>Price Chart</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">BTC/USD</Badge>
                  <Badge variant="outline">1H</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-trading-bg rounded-lg">
                <p className="text-muted-foreground">Price chart integration coming soon</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Order Book / Market Data */}
          <Card className="trading-panel">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Market Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">24h High</h4>
                  <p className="text-lg font-mono font-bold">$66,450.00</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">24h Low</h4>
                  <p className="text-lg font-mono font-bold">$64,120.00</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">24h Volume</h4>
                  <p className="text-lg font-mono font-bold">2,847 BTC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}