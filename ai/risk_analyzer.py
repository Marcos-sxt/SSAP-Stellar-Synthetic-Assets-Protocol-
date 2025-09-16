#!/usr/bin/env python3
"""
SAPP AI Risk Analyzer
Sistema de análise de risco em tempo real para posições de spread trading
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

class SAPPRiskAnalyzer:
    """Analisador de risco principal do SAPP"""
    
    def __init__(self, backend_url: str = "http://localhost:5000"):
        self.backend_url = backend_url
        self.positions: Dict[int, PositionData] = {}
        self.price_history: Dict[str, List[Tuple[datetime, float]]] = {}
        self.risk_thresholds = {
            'LOW': 0.3,
            'MEDIUM': 0.5,
            'HIGH': 0.7,
            'CRITICAL': 0.9
        }
        self.running = False
        self.analysis_thread = None
        
    def start_monitoring(self):
        """Inicia o monitoramento contínuo"""
        logger.info("🚀 Iniciando monitoramento de risco...")
        self.running = True
        self.analysis_thread = threading.Thread(target=self._monitoring_loop)
        self.analysis_thread.daemon = True
        self.analysis_thread.start()
        
    def stop_monitoring(self):
        """Para o monitoramento"""
        logger.info("🛑 Parando monitoramento de risco...")
        self.running = False
        if self.analysis_thread:
            self.analysis_thread.join()
            
    def _monitoring_loop(self):
        """Loop principal de monitoramento"""
        while self.running:
            try:
                # Atualizar dados das posições
                self._update_positions()
                
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
                
    def _update_positions(self):
        """Atualiza dados das posições do backend"""
        try:
            # Simular dados das posições (em produção, viria do backend)
            # Por enquanto, vamos usar dados estáticos para teste
            pass
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar posições: {e}")
            
    def _calculate_risk_score(self, position: PositionData) -> float:
        """Calcula score de risco para uma posição (0-1)"""
        try:
            # 1. Análise de volatilidade do spread
            volatility_score = self._calculate_volatility_risk(position)
            
            # 2. Análise de margem
            margin_score = self._calculate_margin_risk(position)
            
            # 3. Análise de tendência
            trend_score = self._calculate_trend_risk(position)
            
            # 4. Análise de liquidação
            liquidation_score = self._calculate_liquidation_risk(position)
            
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
            
    def _calculate_volatility_risk(self, position: PositionData) -> float:
        """Calcula risco baseado na volatilidade do spread"""
        try:
            # Simular análise de volatilidade
            # Em produção, usaria dados históricos reais
            spread_change = abs(position.current_spread - position.entry_spread)
            spread_percentage = spread_change / abs(position.entry_spread) if position.entry_spread != 0 else 0
            
            # Volatilidade alta = risco alto
            if spread_percentage > 0.1:  # 10% de mudança
                return 0.8
            elif spread_percentage > 0.05:  # 5% de mudança
                return 0.6
            elif spread_percentage > 0.02:  # 2% de mudança
                return 0.4
            else:
                return 0.2
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular volatilidade: {e}")
            return 0.5
            
    def _calculate_margin_risk(self, position: PositionData) -> float:
        """Calcula risco baseado na margem disponível"""
        try:
            # Simular análise de margem
            # Em produção, calcularia margem real vs. necessária
            margin_ratio = 0.8  # Simular 80% de margem utilizada
            
            if margin_ratio > 0.9:  # 90%+ utilizada
                return 0.9
            elif margin_ratio > 0.8:  # 80%+ utilizada
                return 0.7
            elif margin_ratio > 0.6:  # 60%+ utilizada
                return 0.5
            else:
                return 0.3
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular margem: {e}")
            return 0.5
            
    def _calculate_trend_risk(self, position: PositionData) -> float:
        """Calcula risco baseado na tendência do spread"""
        try:
            # Simular análise de tendência
            # Em produção, usaria análise técnica real
            spread_change = position.current_spread - position.entry_spread
            
            # Tendência desfavorável = risco alto
            if abs(spread_change) > 0.05:  # Mudança significativa
                return 0.8
            elif abs(spread_change) > 0.02:  # Mudança moderada
                return 0.6
            else:
                return 0.4
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular tendência: {e}")
            return 0.5
            
    def _calculate_liquidation_risk(self, position: PositionData) -> float:
        """Calcula risco de liquidação iminente"""
        try:
            # Simular análise de liquidação
            # Em produção, calcularia distância real da liquidação
            liquidation_distance = 0.15  # Simular 15% de distância da liquidação
            
            if liquidation_distance < 0.05:  # 5% de distância
                return 0.9
            elif liquidation_distance < 0.1:  # 10% de distância
                return 0.7
            elif liquidation_distance < 0.2:  # 20% de distância
                return 0.5
            else:
                return 0.3
                
        except Exception as e:
            logger.error(f"❌ Erro ao calcular liquidação: {e}")
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
                "overall_risk": "HIGH" if critical_positions > 0 else "MEDIUM" if high_risk_positions > 0 else "LOW"
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar resumo: {e}")
            return {"error": str(e)}

def main():
    """Função principal para teste"""
    logger.info("🧠 Iniciando SAPP Risk Analyzer...")
    
    # Criar analisador
    analyzer = SAPPRiskAnalyzer()
    
    # Simular posições para teste
    test_position = PositionData(
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
    
    analyzer.positions[1] = test_position
    
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