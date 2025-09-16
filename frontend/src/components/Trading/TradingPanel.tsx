import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calculator, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useWebSocket, PriceData } from '@/hooks/useWebSocket';
import { useWallet } from '@/contexts/WalletContext';

// Asset definitions with metadata
const assetDefinitions = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', category: 'crypto' },
  { symbol: 'WTI', name: 'WTI Crude Oil', category: 'commodity' },
  { symbol: 'BRENT', name: 'Brent Crude Oil', category: 'commodity' },
  { symbol: 'GOLD', name: 'Gold', category: 'commodity' },
  { symbol: 'SILVER', name: 'Silver', category: 'commodity' },
  { symbol: 'COPPER', name: 'Copper', category: 'commodity' },
  { symbol: 'NATGAS', name: 'Natural Gas', category: 'commodity' },
];

export function TradingPanel() {
  const { prices } = useWebSocket();
  const { balance, isConnected, signTransactionXdr } = useWallet();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [executionMessage, setExecutionMessage] = useState('');
  
  const xlmBalance = balance ? parseFloat(balance) : 0;

  // Create assets with real-time prices
  const assets = useMemo(() => {
    return assetDefinitions.map(def => {
      const priceData = prices.find(p => p.symbol === def.symbol);
      return {
        ...def,
        price: priceData?.price || 0,
        change: priceData?.change || 0,
        changePercent: priceData?.changePercent || 0,
        source: priceData?.source || 'N/A'
      };
    }).filter(asset => asset.price > 0); // Only show assets with prices
  }, [prices]);

  const selectedAsset = assets.find(asset => asset.symbol === selectedSymbol) || assets[0];

  const sizeValue = parseFloat(size) || 0;
  const requiredCollateral = selectedAsset ? (sizeValue * selectedAsset.price) / leverage : 0;
  const maxSize = selectedAsset ? (xlmBalance * leverage) / selectedAsset.price : 0;
  
  // Validation
  const isValidSize = sizeValue > 0 && sizeValue <= maxSize;
  const hasInsufficientBalance = requiredCollateral > xlmBalance;

  const handleExecute = async () => {
    if (!selectedAsset || !isConnected) return;
    
    console.log('Execute trade:', {
      asset: selectedAsset.symbol,
      type: positionType,
      size: sizeValue,
      leverage,
      collateral: requiredCollateral,
      currentPrice: selectedAsset.price
    });

    setIsExecuting(true);
    setExecutionStatus('idle');
    setExecutionMessage('');

    try {
      // TODO: Implement actual smart contract integration
      // For now, simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/error based on balance
      if (requiredCollateral <= xlmBalance) {
        setExecutionStatus('success');
        setExecutionMessage(`Successfully opened ${positionType} position for ${sizeValue} ${selectedAsset.symbol}`);
        
        // Reset form after successful execution
        setTimeout(() => {
          setSize('');
          setExecutionStatus('idle');
          setExecutionMessage('');
        }, 3000);
      } else {
        setExecutionStatus('error');
        setExecutionMessage('Insufficient balance for this position');
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      setExecutionStatus('error');
      setExecutionMessage('Failed to execute trade. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="trading-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Open Position</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection */}
        <div className="space-y-2">
          <Label>Asset</Label>
          <Select
            value={selectedSymbol}
            onValueChange={setSelectedSymbol}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.symbol} value={asset.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{asset.symbol}</span>
                      <Badge variant="secondary" className="text-xs">
                        {asset.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        ${asset.price.toFixed(2)}
                      </div>
                      <div className={cn(
                        "text-xs font-mono",
                        asset.change >= 0 ? "text-success" : "text-danger"
                      )}>
                        {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position Type */}
        <div className="space-y-2">
          <Label>Position Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={positionType === 'long' ? 'default' : 'outline'}
              onClick={() => setPositionType('long')}
              className={cn(
                positionType === 'long' && "bg-success text-success-foreground hover:bg-success/90"
              )}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Long
            </Button>
            <Button
              variant={positionType === 'short' ? 'default' : 'outline'}
              onClick={() => setPositionType('short')}
              className={cn(
                positionType === 'short' && "bg-danger text-danger-foreground hover:bg-danger/90"
              )}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Short
            </Button>
          </div>
        </div>

        {/* Size Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Size</Label>
            <span className="text-xs text-muted-foreground">
              Max: {maxSize.toFixed(4)} {selectedAsset?.symbol || 'N/A'}
            </span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={cn(
              "font-mono",
              sizeValue > 0 && !isValidSize && "border-danger focus:border-danger"
            )}
            disabled={!selectedAsset}
          />
          {sizeValue > 0 && !isValidSize && (
            <p className="text-xs text-danger">
              Size exceeds maximum available ({maxSize.toFixed(4)} {selectedAsset?.symbol})
            </p>
          )}
        </div>

        {/* Leverage */}
        <div className="space-y-2">
          <Label>Leverage</Label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((lev) => (
              <Button
                key={lev}
                variant={leverage === lev ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLeverage(lev)}
                className={cn(
                  leverage === lev && "bg-primary text-primary-foreground"
                )}
              >
                {lev}x
              </Button>
            ))}
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Position Summary</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position Value</span>
              <span className="font-mono">
                ${selectedAsset ? (sizeValue * selectedAsset.price).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required Collateral</span>
              <span className="font-mono">{requiredCollateral.toFixed(2)} XLM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Balance</span>
              <span className="font-mono">{xlmBalance.toFixed(2)} XLM</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-medium">
                <span>Remaining Balance</span>
                <span className={cn(
                  "font-mono",
                  (xlmBalance - requiredCollateral) >= 0 ? "text-success" : "text-danger"
                )}>
                  {(xlmBalance - requiredCollateral).toFixed(2)} XLM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Status Message */}
        {executionMessage && (
          <div className={cn(
            "p-3 rounded-lg flex items-center space-x-2 text-sm",
            executionStatus === 'success' 
              ? "bg-success/10 text-success border border-success/20"
              : executionStatus === 'error'
              ? "bg-danger/10 text-danger border border-danger/20"
              : "bg-muted text-muted-foreground"
          )}>
            {executionStatus === 'success' && <CheckCircle className="w-4 h-4" />}
            {executionStatus === 'error' && <XCircle className="w-4 h-4" />}
            <span>{executionMessage}</span>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!isConnected || !selectedAsset || !isValidSize || hasInsufficientBalance || isExecuting}
          className={cn(
            "w-full font-medium",
            positionType === 'long'
              ? "bg-success text-success-foreground hover:bg-success/90"
              : "bg-danger text-danger-foreground hover:bg-danger/90"
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing Trade...
            </>
          ) : !isConnected 
            ? 'Connect Wallet to Trade'
            : !selectedAsset 
              ? 'Select an Asset' 
              : positionType === 'long' 
                ? 'Open Long Position' 
                : 'Open Short Position'
          }
        </Button>
      </CardContent>
    </Card>
  );
}