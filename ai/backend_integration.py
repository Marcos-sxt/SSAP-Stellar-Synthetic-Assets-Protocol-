#!/usr/bin/env python3
"""
SAPP Backend Integration
Integração da IA com o backend Node.js
"""

import requests
import json
import websocket
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class SAPPBackendIntegration:
    """Integração com o backend SAPP"""
    
    def __init__(self, backend_url: str = "http://localhost:5000", ws_url: str = "ws://localhost:8080"):
        self.backend_url = backend_url
        self.ws_url = ws_url
        self.ws = None
        self.connected = False
        self.positions = {}
        
    def connect_websocket(self):
        """Conecta ao WebSocket do backend"""
        try:
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_open=self._on_open,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close
            )
            
            # Executar em thread separada
            ws_thread = threading.Thread(target=self.ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
        except Exception as e:
            logger.error(f"❌ Erro ao conectar WebSocket: {e}")
            
    def _on_open(self, ws):
        """Callback de conexão aberta"""
        logger.info("🔗 WebSocket conectado")
        self.connected = True
        
    def _on_message(self, ws, message):
        """Callback de mensagem recebida"""
        try:
            data = json.loads(message)
            logger.info(f"📨 Mensagem recebida: {data}")
            
            # Processar dados de preços
            if 'prices' in data:
                self._process_price_update(data['prices'])
                
        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem: {e}")
            
    def _on_error(self, ws, error):
        """Callback de erro"""
        logger.error(f"❌ Erro WebSocket: {error}")
        self.connected = False
        
    def _on_close(self, ws, close_status_code, close_msg):
        """Callback de conexão fechada"""
        logger.info("🔌 WebSocket desconectado")
        self.connected = False
        
    def _process_price_update(self, prices: Dict):
        """Processa atualização de preços"""
        try:
            # Atualizar preços das posições
            for position_id, position in self.positions.items():
                # Calcular novo spread baseado nos preços
                leg1_price = prices.get(position.leg1_market, {}).get('price', 0)
                leg2_price = prices.get(position.leg2_market, {}).get('price', 0)
                
                if leg1_price and leg2_price:
                    new_spread = leg1_price - leg2_price
                    position.current_spread = new_spread
                    position.timestamp = datetime.now()
                    
                    logger.info(f"📊 Posição {position_id}: Spread atualizado para {new_spread}")
                    
        except Exception as e:
            logger.error(f"❌ Erro ao processar preços: {e}")
            
    def get_positions(self) -> List[Dict]:
        """Obtém posições do backend"""
        try:
            response = requests.get(f"{self.backend_url}/api/positions")
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"❌ Erro ao obter posições: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Erro na requisição: {e}")
            return []
            
    def send_alert(self, alert: Dict):
        """Envia alerta para o backend"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/alerts",
                json=alert,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info("✅ Alerta enviado com sucesso")
            else:
                logger.error(f"❌ Erro ao enviar alerta: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Erro ao enviar alerta: {e}")
            
    def get_price_data(self, market: str) -> Optional[Dict]:
        """Obtém dados de preço de um mercado"""
        try:
            response = requests.get(f"{self.backend_url}/api/prices/{market}")
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.error(f"❌ Erro ao obter preço de {market}: {e}")
            return None
