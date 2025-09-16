import { useEffect, useState, useCallback, useRef } from 'react';

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  source: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'crypto_prices' | 'commodity_prices' | 'error';
  data: PriceData[] | string;
  timestamp: number;
}

export interface UseWebSocketReturn {
  prices: PriceData[];
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const WEBSOCKET_URL = 'wss://ssap-stellar-synthetic-assets-protocol.onrender.com';

export function useWebSocket(): UseWebSocketReturn {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', message);
          console.log('🔍 Crypto data:', message.crypto);
          console.log('🔍 Commodities data:', message.commodities);
          
          if (message.type === 'price_update' || message.type === 'initial_data') {
            const newPrices: PriceData[] = [];
            
            // Process crypto prices (objects, not arrays)
            if (message.crypto && typeof message.crypto === 'object') {
              console.log('🪙 Processing crypto prices:', Object.keys(message.crypto).length);
              Object.entries(message.crypto).forEach(([symbol, priceData]: [string, any]) => {
                console.log('🪙 Crypto price:', symbol, priceData);
                newPrices.push({
                  symbol: symbol,
                  price: priceData.price,
                  change: priceData.change || 0,
                  changePercent: priceData.changePercent || 0,
                  source: priceData.source || 'UNKNOWN',
                  timestamp: message.timestamp || Date.now()
                });
              });
            } else {
              console.log('❌ Crypto data is not an object:', typeof message.crypto, message.crypto);
            }
            
            // Process commodity prices (objects, not arrays)
            if (message.commodities && typeof message.commodities === 'object') {
              console.log('🛢️ Processing commodity prices:', Object.keys(message.commodities).length);
              Object.entries(message.commodities).forEach(([symbol, priceData]: [string, any]) => {
                console.log('🛢️ Commodity price:', symbol, priceData);
                newPrices.push({
                  symbol: symbol,
                  price: priceData.price,
                  change: priceData.change || 0,
                  changePercent: priceData.changePercent || 0,
                  source: priceData.source || 'UNKNOWN',
                  timestamp: message.timestamp || Date.now()
                });
              });
            } else {
              console.log('❌ Commodities data is not an object:', typeof message.commodities, message.commodities);
            }
            
            console.log('📊 Total new prices to add:', newPrices.length);
            console.log('📊 New prices:', newPrices);
            
            if (newPrices.length > 0) {
              setPrices(prevPrices => {
                console.log('📊 Previous prices:', prevPrices.length);
                // Merge new prices with existing ones, updating existing symbols
                const priceMap = new Map<string, PriceData>();
                
                // Add existing prices
                prevPrices.forEach(price => {
                  priceMap.set(price.symbol, price);
                });
                
                // Update with new prices
                newPrices.forEach(price => {
                  priceMap.set(price.symbol, price);
                });
                
                const finalPrices = Array.from(priceMap.values());
                console.log('📊 Final prices after merge:', finalPrices.length);
                return finalPrices;
              });
            } else {
              console.log('❌ No new prices to add');
            }
          } else if (message.type === 'error') {
            setError(message.data || 'Unknown error');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Failed to parse message from server');
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else {
          setError('Failed to reconnect to server');
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to server');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    reconnectAttempts.current = 0;
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    prices,
    isConnected,
    error,
    reconnect
  };
}
