#!/bin/bash

echo "🚀 Configurando SAPP - Stellar AI Perp Protocol"
echo "================================================"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Instalar dependências do projeto principal
echo "📦 Instalando dependências do projeto principal..."
npm install

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install
cd ..

# Instalar dependências da IA
echo "📦 Instalando dependências da IA..."
cd ai
pip install -r requirements.txt
cd ..

# Verificar se Soroban CLI está instalado
echo "🔍 Verificando Soroban CLI..."
if ! command -v soroban &> /dev/null; then
    echo "⚠️  Soroban CLI não encontrado. Instalando..."
    cargo install soroban-cli
else
    echo "✅ Soroban CLI já instalado"
fi

# Configurar rede Stellar testnet
echo "🌐 Configurando rede Stellar testnet..."
soroban config network add testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015"

# Criar arquivo .env para o backend
echo "⚙️  Criando arquivo de configuração..."
cp backend/env.example backend/.env

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite backend/.env com o ID do contrato após deploy"
echo "2. Execute: npm run dev (para rodar backend + frontend)"
echo "3. Execute: npm run ai (para rodar IA em terminal separado)"
echo ""
echo "🚀 Para começar:"
echo "   cd contracts && soroban contract build"
echo "   soroban contract deploy --network testnet"
echo "   npm run dev"
