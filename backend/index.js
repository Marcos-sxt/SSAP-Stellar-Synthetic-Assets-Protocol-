const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { Horizon } = require('@stellar/stellar-sdk');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://ssap-frontend.vercel.app", "https://*.vercel.app"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://ssap-frontend.vercel.app", "https://*.vercel.app"],
  credentials: true
}));
app.use(express.json());

// Cache em memória
const positionsCache = new Map();
const pricesCache = new Map();
const riskAlerts = new Map();

// Configuração Stellar
const stellarServer = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = 'Test SDF Network ; September 2015';

// Configuração do contrato (será preenchido após deploy)
let contractId = process.env.CONTRACT_ID || '';

// Simulação de preços do Reflector Oracle
const mockPrices = {
  'BTC': 45000,
  'ETH': 3000,
  'XLM': 0.12
};

// Atualizar preços a cada 30 segundos
setInterval(async () => {
  try {
    // Simular variação de preços
    Object.keys(mockPrices).forEach(asset => {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variação
      mockPrices[asset] = mockPrices[asset] * (1 + variation);
      pricesCache.set(asset, mockPrices[asset]);
    });

    // Calcular risco para posições ativas
    calculateRiskForPositions();

    // Emitir atualizações via WebSocket
    io.emit('price_update', Object.fromEntries(pricesCache));
    io.emit('risk_update', Object.fromEntries(riskAlerts));

  } catch (error) {
    console.error('Erro ao atualizar preços:', error);
  }
}, 30000);

// Calcular risco para posições ativas
function calculateRiskForPositions() {
  positionsCache.forEach((position, positionId) => {
    if (position.status === 'Active') {
      const currentPrice = pricesCache.get(position.asset) || 0;
      const riskScore = calculateRiskScore(position, currentPrice);
      
      if (riskScore > 80) {
        riskAlerts.set(positionId, {
          type: 'HIGH_RISK',
          message: 'Posição em alto risco de liquidação',
          positionId,
          riskScore,
          timestamp: Date.now()
        });
      } else if (riskScore > 60) {
        riskAlerts.set(positionId, {
          type: 'MEDIUM_RISK',
          message: 'Posição em risco moderado',
          positionId,
          riskScore,
          timestamp: Date.now()
        });
      } else {
        riskAlerts.delete(positionId);
      }
    }
  });
}

// Calcular score de risco
function calculateRiskScore(position, currentPrice) {
  if (!currentPrice || currentPrice === 0) return 0;

  const positionValue = position.size * currentPrice;
  const collateralValue = position.collateral;
  const marginRatio = (collateralValue * 100) / positionValue;
  
  // Score baseado na margem (0-100)
  const marginScore = Math.max(0, 100 - marginRatio);
  
  // Score baseado na distância até liquidação
  const liquidationDistance = Math.abs(currentPrice - position.liquidation_price) / currentPrice;
  const liquidationScore = Math.min(100, liquidationDistance * 1000);
  
  // Score final (média ponderada)
  const riskScore = (marginScore * 0.7 + liquidationScore * 0.3);
  
  return Math.min(100, Math.max(0, riskScore));
}

// API Routes

// Obter preços atuais
app.get('/api/prices', (req, res) => {
  res.json(Object.fromEntries(pricesCache));
});

// Obter posições do usuário
app.get('/api/positions/:user', (req, res) => {
  const user = req.params.user;
  const userPositions = Array.from(positionsCache.values())
    .filter(pos => pos.user === user);
  res.json(userPositions);
});

// Obter todas as posições ativas
app.get('/api/positions', (req, res) => {
  const activePositions = Array.from(positionsCache.values())
    .filter(pos => pos.status === 'Active');
  res.json(activePositions);
});

// Abrir nova posição
app.post('/api/positions/open', async (req, res) => {
  try {
    const { user, asset, side, size, collateral, leverage } = req.body;
    
    // Validar parâmetros
    if (!user || !asset || !side || !size || !collateral || !leverage) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }

    if (leverage < 1 || leverage > 5) {
      return res.status(400).json({ error: 'Alavancagem deve ser entre 1x e 5x' });
    }

    const currentPrice = pricesCache.get(asset) || 0;
    if (currentPrice === 0) {
      return res.status(400).json({ error: 'Preço não disponível para este ativo' });
    }

    // Calcular preço de liquidação
    const liquidationPrice = side === 'Long' 
      ? currentPrice - (currentPrice * 0.8) // 20% margem
      : currentPrice + (currentPrice * 0.8);

    // Criar nova posição
    const positionId = Date.now().toString();
    const position = {
      id: positionId,
      user,
      asset,
      side,
      size: parseFloat(size),
      collateral: parseFloat(collateral),
      leverage: parseInt(leverage),
      entry_price: currentPrice,
      liquidation_price: liquidationPrice,
      timestamp: Date.now(),
      status: 'Active'
    };

    // Armazenar no cache
    positionsCache.set(positionId, position);

    // Calcular risco inicial
    const riskScore = calculateRiskScore(position, currentPrice);
    if (riskScore > 60) {
      riskAlerts.set(positionId, {
        type: riskScore > 80 ? 'HIGH_RISK' : 'MEDIUM_RISK',
        message: riskScore > 80 ? 'Posição em alto risco' : 'Posição em risco moderado',
        positionId,
        riskScore,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, position, riskScore });

  } catch (error) {
    console.error('Erro ao abrir posição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Fechar posição
app.post('/api/positions/close', (req, res) => {
  try {
    const { positionId } = req.body;
    
    if (!positionsCache.has(positionId)) {
      return res.status(404).json({ error: 'Posição não encontrada' });
    }

    const position = positionsCache.get(positionId);
    if (position.status !== 'Active') {
      return res.status(400).json({ error: 'Posição não está ativa' });
    }

    // Fechar posição
    position.status = 'Closed';
    positionsCache.set(positionId, position);
    riskAlerts.delete(positionId);

    res.json({ success: true, position });

  } catch (error) {
    console.error('Erro ao fechar posição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter análise de risco
app.get('/api/risk/:positionId', (req, res) => {
  const positionId = req.params.positionId;
  const position = positionsCache.get(positionId);
  
  if (!position) {
    return res.status(404).json({ error: 'Posição não encontrada' });
  }

  const currentPrice = pricesCache.get(position.asset) || 0;
  const riskScore = calculateRiskScore(position, currentPrice);
  
  res.json({
    positionId,
    riskScore,
    currentPrice,
    liquidationPrice: position.liquidation_price,
    marginRatio: (position.collateral * 100) / (position.size * currentPrice)
  });
});

// WebSocket para updates em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar dados iniciais
  socket.emit('price_update', Object.fromEntries(pricesCache));
  socket.emit('risk_update', Object.fromEntries(riskAlerts));

  // Inscrever em atualizações de preços
  socket.on('subscribe_prices', () => {
    socket.join('price_updates');
  });

  // Inscrever em atualizações de posição
  socket.on('subscribe_position', (positionId) => {
    socket.join(`position_${positionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Inicializar preços
Object.keys(mockPrices).forEach(asset => {
  pricesCache.set(asset, mockPrices[asset]);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SAPP Backend rodando na porta ${PORT}`);
  console.log(`📊 Preços: ${Object.fromEntries(pricesCache)}`);
});
