# Stellar Synthetic Asset Protocol (SSAP)

A decentralized synthetic asset trading platform built on Stellar blockchain, featuring real-time price feeds, AI-powered risk analysis, and seamless wallet integration.

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel](https://ssap-stellar-synthetic-assets-protocol-8jssnouq0.vercel.app) ✅ LIVE
- **Backend**: [Deployed on Render](https://ssap-stellar-synthetic-assets-protocol.onrender.com) ✅ LIVE
- **Smart Contract**: Deployed on Stellar Testnet ✅ LIVE

## 📊 Project Status

| Component | Status | Description |
|-----------|--------|-------------|
| Smart Contract | ✅ Deployed | Deployed on Stellar Testnet |
| Backend | ✅ Live | WebSocket server with multi-oracle feeds |
| Frontend | ✅ Live | React app with Freighter integration |
| AI Risk Analysis | ✅ Live | Real-time risk monitoring |
| Production Deploy | ✅ Complete | Vercel + Render deployment |
| Socket.IO Integration | ✅ Live | Real-time price updates |

## 📋 Features

### Core Functionality
- **Synthetic Asset Trading**: Trade crypto and commodity synthetic assets
- **Real-time Price Feeds**: Multi-oracle price aggregation (Reflector, Chainlink, Binance, Yahoo Finance)
- **Leverage Trading**: Up to 10x leverage on positions
- **AI Risk Analysis**: Real-time position monitoring and risk alerts
- **Wallet Integration**: Seamless Freighter wallet connection

### Supported Assets
- **Cryptocurrencies**: BTC, ETH, XRP, ADA, SOL, MATIC, AVAX, DOT
- **Commodities**: Gold, Silver, Oil, Natural Gas, Wheat, Corn, Soybeans

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Smart Contract  │
│   (React/Vite)  │◄──►│  (Node.js/WS)   │◄──►│   (Soroban)     │
│   - Trading UI  │    │  - Price Feeds  │    │   - XLM Transfers│
│   - Wallet      │    │  - AI Analysis  │    │   - Position Mgmt│
│   - Real-time   │    │  - WebSocket    │    │   - Liquidations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **Shadcn/ui** for styling
- **Freighter API** for wallet integration
- **WebSocket** for real-time data

### Backend
- **Node.js** with Express
- **WebSocket** for real-time communication
- **Multiple Oracle APIs** for price feeds
- **Python AI** for risk analysis

### Smart Contract
- **Rust** with Soroban framework
- **Stellar Testnet** deployment
- **XLM** as collateral currency

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Stellar CLI
- Freighter wallet extension

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ssap-stellar
cd ssap-stellar
```

2. **Install dependencies**
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Smart Contract
cd ../contracts && cargo build
```

3. **Environment Setup**
```bash
# Backend
cp backend/.env.example backend/.env
# Add your API keys to backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

4. **Deploy Smart Contract**
```bash
# Deploy to Stellar Testnet
cd contracts
stellar contract deploy --source-account admin --network testnet
```

5. **Start Development Servers**
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

## 📁 Project Structure

```
ssap-stellar/
├── contracts/           # Stellar smart contract (Rust/Soroban)
│   ├── src/
│   │   ├── lib.rs      # Main contract logic
│   │   └── test.rs     # Unit tests
│   └── Cargo.toml
├── backend/            # Node.js backend server
│   ├── services/       # Business logic services
│   ├── websocket-server.js
│   └── package.json
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── contexts/   # React contexts
│   │   └── hooks/      # Custom hooks
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Smart Contract
- **Contract ID**: `CBTUI3R6FK5C4P6AXC2QN6IDHVILTT4KNK26CW6AZLJ3SGSOEMSKIQFR`
- **Network**: Stellar Testnet
- **Admin**: `[ADMIN_ADDRESS]` (Update after deployment)

### Backend APIs
- **WebSocket**: `ws://localhost:8080` (Local) / `wss://ssap-stellar-synthetic-assets-protocol.onrender.com` (Production)
- **REST API**: `http://localhost:8080/api` (Local) / `https://ssap-stellar-synthetic-assets-protocol.onrender.com/api` (Production)

### Frontend
- **Development**: `http://localhost:5173`
- **Production**: [https://ssap-stellar-synthetic-assets-protocol-8jssnouq0.vercel.app](https://ssap-stellar-synthetic-assets-protocol-8jssnouq0.vercel.app)

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
cargo test
```

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push to main

### Backend (Render)
1. Connect GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `node websocket-server.js`
4. Add environment variables

### Smart Contract (Stellar)
```bash
# Deploy to Testnet
stellar contract deploy --source-account admin --network testnet

# Deploy to Mainnet (Production)
stellar contract deploy --source-account admin --network mainnet
```

## 📊 API Endpoints

### WebSocket
- **Connection**: `ws://localhost:8080`
- **Events**: `price_update`, `risk_alert`, `position_update`

### REST API
- `GET /api/prices` - Get current asset prices
- `GET /api/positions` - Get user positions
- `POST /api/trade` - Execute trade

## 🔒 Security

- **Smart Contract**: Audited and tested
- **API Keys**: Environment variables only
- **Wallet**: Freighter secure integration
- **HTTPS**: All production traffic encrypted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/ssap-stellar/wiki) (Coming Soon)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ssap-stellar/issues) (Coming Soon)
- **Discord**: [Community Server](https://discord.gg/ssap) (Coming Soon)

## 🎯 Roadmap

- [ ] Mainnet deployment
- [ ] Additional asset support
- [ ] Mobile app
- [ ] Advanced trading features
- [ ] Governance token

---

**Built with ❤️ for the Stellar ecosystem**