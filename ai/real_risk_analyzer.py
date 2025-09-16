#!/usr/bin/env python3
"""
SAPP Real Risk Analyzer
Versão que se conecta com dados reais do backend e smart contract
"""

import requests
import json
import time
import websocket
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class RiskAlert:
    """Estrutura para alertas de risco"""
    position_id: int
    alert_type: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    message: str
    risk_score: float
    timestamp: datetime
    recommendation: str

@dataclass
class PositionData:
    """Dados de uma posição para análise"""
    position_id: int
    leg1_market: str
    leg2_market: str
    leg1_size: int
    leg2_size: int
    margin: int
    entry_spread: float
    current_spread: float
    timestamp: datetime

class SAPPRealRiskAnalyzer:
    """Analisador de risco com dados reais do SAPP"""
    
    def __init__(self, backend_url: str = "http://localhost:5000", ws_url: str = "ws://localhost:8080"):
        self.backend_url = backend_url
        self.ws_url = ws_url
        self.positions: Dict[int, PositionData] = {}
        self.price_history: Dict[str, List[Tuple[datetime, float]]] = {}
        self.current_prices: Dict[str, float] = {}
        self.risk_thresholds = {
            'LOW': 0.3,
            'MEDIUM': 0.5,
            'HIGH': 0.7,
            'CRITICAL': 0.9
        }
        self.running = False
        self.analysis_thread = None
        self.ws = None
        self.connected = False
        
    def start_monitoring(self):
        """Inicia o monitoramento contínuo"""
        logger.info("🚀 Iniciando monitoramento de risco com dados reais...")
        self.running = True
        
        # Conectar WebSocket para preços em tempo real
        self._connect_websocket()
        
        # Iniciar thread de análise
        self.analysis_thread = threading.Thread(target=self._monitoring_loop)
        self.analysis_thread.daemon = True
        self.analysis_thread.start()
        
    def stop_monitoring(self):
        """Para o monitoramento"""
        logger.info("🛑 Parando monitoramento de risco...")
        self.running = False
        if self.analysis_thread:
            self.analysis_thread.join()
        if self.ws:
            self.ws.close()
            
    def _connect_websocket(self):
        """Conecta ao WebSocket para preços em tempo real"""
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
        logger.info("🔗 WebSocket conectado - recebendo preços em tempo real")
        self.connected = True
        
    def _on_message(self, ws, message):
        """Callback de mensagem recebida"""
        try:
            data = json.loads(message)
            
            # Processar dados de preços
            if 'prices' in data:
                self._process_price_update(data['prices'])
            elif 'crypto' in data:
                self._process_crypto_prices(data['crypto'])
            elif 'commodity' in data:
                self._process_commodity_prices(data['commodity'])
                
        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem WebSocket: {e}")
            
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
            for market, price_data in prices.items():
                if isinstance(price_data, dict) and 'price' in price_data:
                    self.current_prices[market] = price_data['price']
                    logger.info(f"📊 Preço atualizado: {market} = ${price_data['price']:.2f}")
                    
        except Exception as e:
            logger.error(f"❌ Erro ao processar preços: {e}")
            
    def _process_crypto_prices(self, crypto_prices: Dict):
        """Processa preços de cripto"""
        try:
            for crypto, price_data in crypto_prices.items():
                if isinstance(price_data, dict) and 'price' in price_data:
                    self.current_prices[crypto] = price_data['price']
                    
        except Exception as e:
            logger.error(f"❌ Erro ao processar preços de crypto: {e}")
            
    def _process_commodity_prices(self, commodity_prices: Dict):
        """Processa preços de commodities"""
        try:
            for commodity, price_data in commodity_prices.items():
                if isinstance(price_data, dict) and 'price' in price_data:
                    self.current_prices[commodity] = price_data['price']
                    
        except Exception as e:
            logger.error(f"❌ Erro ao processar preços de commodities: {e}")
            
    def _monitoring_loop(self):
        """Loop principal de monitoramento"""
        while self.running:
            try:
                # Atualizar dados das posições do smart contract
                self._update_positions_from_contract()
                
                # Analisar cada posição
                for position_id, position in self.positions.items():
                    risk_score = self._calculate_risk_score(position)
                    alert = self._generate_alert(position, risk_score)
                    
                    if alert:
                        self._handle_alert(alert)
                        
                # Aguardar próxima análise (30 segundos)
                time.sleep(30)
                
            except Exception as e:
                logger.error(f"❌ Erro no loop de monitoramento: {e}")
                time.sleep(10)
                
    def _update_positions_from_contract(self):
        """Atualiza posições do smart contract via backend"""
        try:
            # Em produção, faria chamada para o backend que consulta o smart contract
            # Por enquanto, vamos simular com dados estáticos
            # TODO: Implementar chamada real para o backend
            
            # Simular posições ativas (em produção viria do contrato)
            if not self.positions:
                # Adicionar posições de teste se não existirem
                self.positions[1] = PositionData(
                    position_id=1,
                    leg1_market="WTI",
                    leg2_market="Brent",
                    leg1_size=1000,
                    leg2_size=-1000,
                    margin=1000000,
                    entry_spread=-400000000000,  # -$4.00
                    current_spread=-400000000000,  # -$4.00
                    timestamp=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar posições: {e}")
            
    def _calculate_risk_score(self, position: PositionData) -> float:
        """Calcula score de risco para uma posição (0-1) com dados reais"""
        try:
            # 1. Análise de volatilidade do spread (REAL)
            volatility_score = self._calculate_volatility_risk_real(position)
            
            # 2. Análise de margem (REAL)
            margin_score = self._calculate_margin_risk_real(position)
            
            # 3. Análise de tendência (REAL)
            trend_score = self._calculate_trend_risk_real(position)
            
            # 4. Análise de liquidação (REAL)
            liquidation_score = self._calculate_liquidation_risk_real(position)
            
            # Score final (média ponderada)
            risk_score = (
                volatility_score * 0.3 +
                margin_score * 0.3 +
                trend_score * 0.2 +
                liquidation_score * 0.2
            )
            
            return min(1.0, max(0.0, risk_score))
            
        except Exception as e:
            logger.error(f"❌ Erro ao calcular score de risco: {e}")
            return 0.5  # Score neutro em caso de erro
            
    def _calculate_volatility_risk_real(self, position: PositionData) -> float:
        """Calcula risco baseado na volatilidade real do spread"""
        try:
            # Calcular spread atual baseado nos preços reais
            leg1_price = self.current_prices.get(position.leg1_market, 0)
            leg2_price = self.current_prices.get(position.leg2_market, 0)
            
            if leg1_price and leg2_price:
                current_spread = leg1_price - leg2_price
                spread_change = abs(current_spread - position.entry_spread)
                spread_percentage = spread_change / abs(position.entry_spread) if position.entry_spread != 0 else 0
                
                # Atualizar spread atual
                position.current_spread = current_spread
                
                # Volatilidade alta = risco alto
                if spread_percentage > 0.1:  # 10% de mudança
                    return 0.8
                elif spread_percentage > 0.05:  # 5% de mudança
                    return 0.6
                elif spread_percentage > 0.02:  # 2% de mudança
                    return 0.4
                else:
                    return 0.2
            else:
                logger.warning(f"⚠️ Preços não disponíveis para {position.leg1_market} ou {position.leg2_market}")
                return 0.5  # Score neutro se preços não disponíveis
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular volatilidade real: {e}")
            return 0.5
            
    def _calculate_margin_risk_real(self, position: PositionData) -> float:
        """Calcula risco baseado na margem real"""
        try:
            # Calcular margem necessária baseada no spread atual
            leg1_price = self.current_prices.get(position.leg1_market, 0)
            leg2_price = self.current_prices.get(position.leg2_market, 0)
            
            if leg1_price and leg2_price:
                # Calcular valor da posição
                leg1_value = abs(position.leg1_size) * leg1_price
                leg2_value = abs(position.leg2_size) * leg2_price
                total_value = max(leg1_value, leg2_value)
                
                # Margem necessária (20% do valor da posição)
                required_margin = total_value * 0.2
                
                # Calcular ratio de margem
                margin_ratio = position.margin / required_margin if required_margin > 0 else 1.0
                
                # Margem baixa = risco alto
                if margin_ratio < 1.1:  # Margem insuficiente
                    return 0.9
                elif margin_ratio < 1.2:  # Margem baixa
                    return 0.7
                elif margin_ratio < 1.5:  # Margem adequada
                    return 0.5
                else:
                    return 0.3  # Margem confortável
            else:
                return 0.5  # Score neutro se preços não disponíveis
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular margem real: {e}")
            return 0.5
            
    def _calculate_trend_risk_real(self, position: PositionData) -> float:
        """Calcula risco baseado na tendência real do spread"""
        try:
            # Calcular spread atual
            leg1_price = self.current_prices.get(position.leg1_market, 0)
            leg2_price = self.current_prices.get(position.leg2_market, 0)
            
            if leg1_price and leg2_price:
                current_spread = leg1_price - leg2_price
                spread_change = current_spread - position.entry_spread
                spread_change_percentage = spread_change / abs(position.entry_spread) if position.entry_spread != 0 else 0
                
                # Tendência desfavorável = risco alto
                if abs(spread_change_percentage) > 0.1:  # 10% de mudança
                    return 0.8
                elif abs(spread_change_percentage) > 0.05:  # 5% de mudança
                    return 0.6
                elif abs(spread_change_percentage) > 0.02:  # 2% de mudança
                    return 0.4
                else:
                    return 0.2
            else:
                return 0.5
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular tendência real: {e}")
            return 0.5
            
    def _calculate_liquidation_risk_real(self, position: PositionData) -> float:
        """Calcula risco de liquidação baseado em dados reais"""
        try:
            # Calcular distância da liquidação
            leg1_price = self.current_prices.get(position.leg1_market, 0)
            leg2_price = self.current_prices.get(position.leg2_market, 0)
            
            if leg1_price and leg2_price:
                # Calcular valor da posição
                leg1_value = abs(position.leg1_size) * leg1_price
                leg2_value = abs(position.leg2_size) * leg2_price
                total_value = max(leg1_value, leg2_value)
                
                # Margem necessária (20%)
                required_margin = total_value * 0.2
                
                # Distância da liquidação
                liquidation_distance = (position.margin - required_margin) / required_margin if required_margin > 0 else 1.0
                
                # Distância baixa = risco alto
                if liquidation_distance < 0.1:  # 10% de distância
                    return 0.9
                elif liquidation_distance < 0.2:  # 20% de distância
                    return 0.7
                elif liquidation_distance < 0.5:  # 50% de distância
                    return 0.5
                else:
                    return 0.3  # Distância confortável
            else:
                return 0.5
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular liquidação real: {e}")
            return 0.5
            
    def _generate_alert(self, position: PositionData, risk_score: float) -> Optional[RiskAlert]:
        """Gera alerta baseado no score de risco"""
        try:
            # Determinar tipo de alerta
            if risk_score >= self.risk_thresholds['CRITICAL']:
                alert_type = 'CRITICAL'
                message = f"🚨 RISCO CRÍTICO: Posição {position.position_id} em perigo extremo!"
                recommendation = "Fechar posição imediatamente ou adicionar margem"
            elif risk_score >= self.risk_thresholds['HIGH']:
                alert_type = 'HIGH'
                message = f"⚠️ ALTO RISCO: Posição {position.position_id} em perigo!"
                recommendation = "Considerar fechar posição ou reduzir tamanho"
            elif risk_score >= self.risk_thresholds['MEDIUM']:
                alert_type = 'MEDIUM'
                message = f"⚡ RISCO MÉDIO: Posição {position.position_id} requer atenção"
                recommendation = "Monitorar de perto e estar preparado para ação"
            elif risk_score >= self.risk_thresholds['LOW']:
                alert_type = 'LOW'
                message = f"ℹ️ RISCO BAIXO: Posição {position.position_id} estável"
                recommendation = "Continuar monitorando"
            else:
                return None  # Sem alerta necessário
                
            return RiskAlert(
                position_id=position.position_id,
                alert_type=alert_type,
                message=message,
                risk_score=risk_score,
                timestamp=datetime.now(),
                recommendation=recommendation
            )
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar alerta: {e}")
            return None
            
    def _handle_alert(self, alert: RiskAlert):
        """Processa e exibe alerta"""
        try:
            # Log do alerta
            logger.warning(f"{alert.message} (Score: {alert.risk_score:.2f})")
            logger.info(f"💡 Recomendação: {alert.recommendation}")
            
            # Em produção, enviaria para frontend via WebSocket
            # Por enquanto, apenas log
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar alerta: {e}")
            
    def get_risk_summary(self) -> Dict:
        """Retorna resumo de risco de todas as posições"""
        try:
            if not self.positions:
                return {"message": "Nenhuma posição ativa"}
                
            total_positions = len(self.positions)
            high_risk_positions = 0
            critical_positions = 0
            
            for position in self.positions.values():
                risk_score = self._calculate_risk_score(position)
                if risk_score >= self.risk_thresholds['HIGH']:
                    high_risk_positions += 1
                if risk_score >= self.risk_thresholds['CRITICAL']:
                    critical_positions += 1
                    
            return {
                "total_positions": total_positions,
                "high_risk_positions": high_risk_positions,
                "critical_positions": critical_positions,
                "overall_risk": "HIGH" if critical_positions > 0 else "MEDIUM" if high_risk_positions > 0 else "LOW",
                "current_prices": self.current_prices
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar resumo: {e}")
            return {"error": str(e)}

def main():
    """Função principal para teste"""
    logger.info("🧠 Iniciando SAPP Real Risk Analyzer...")
    
    # Criar analisador
    analyzer = SAPPRealRiskAnalyzer()
    
    # Iniciar monitoramento
    analyzer.start_monitoring()
    
    try:
        # Manter rodando
        while True:
            time.sleep(60)
            summary = analyzer.get_risk_summary()
            logger.info(f"📊 Resumo de risco: {summary}")
            
    except KeyboardInterrupt:
        logger.info("🛑 Parando analisador...")
        analyzer.stop_monitoring()

if __name__ == "__main__":
    main()
