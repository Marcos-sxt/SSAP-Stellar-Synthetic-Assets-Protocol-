#!/usr/bin/env python3
"""
SAPP AI Main
Script principal para executar a IA de análise de risco
"""

import sys
import os
import time
import signal
from datetime import datetime

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from risk_analyzer import SAPPRiskAnalyzer, PositionData
from backend_integration import SAPPBackendIntegration

class SAPP_AI_Main:
    """Classe principal da IA SAPP"""
    
    def __init__(self):
        self.analyzer = SAPPRiskAnalyzer()
        self.backend = SAPPBackendIntegration()
        self.running = False
        
    def start(self):
        """Inicia o sistema de IA"""
        print("🧠 SAPP AI - Sistema de Análise de Risco")
        print("=" * 50)
        print(f"⏰ Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        try:
            # Conectar ao backend
            print("🔗 Conectando ao backend...")
            self.backend.connect_websocket()
            time.sleep(2)  # Aguardar conexão
            
            # Iniciar analisador
            print("🚀 Iniciando analisador de risco...")
            self.analyzer.start_monitoring()
            
            self.running = True
            print("✅ Sistema de IA iniciado com sucesso!")
            print()
            
            # Loop principal
            self._main_loop()
            
        except KeyboardInterrupt:
            print("\n🛑 Parando sistema de IA...")
            self.stop()
        except Exception as e:
            print(f"❌ Erro no sistema: {e}")
            self.stop()
            
    def stop(self):
        """Para o sistema de IA"""
        self.running = False
        self.analyzer.stop_monitoring()
        print("✅ Sistema de IA parado")
        
    def _main_loop(self):
        """Loop principal do sistema"""
        while self.running:
            try:
                # Obter resumo de risco
                summary = self.analyzer.get_risk_summary()
                
                # Exibir status
                print(f"📊 Status: {summary}")
                
                # Aguardar próxima verificação
                time.sleep(60)
                
            except Exception as e:
                print(f"❌ Erro no loop principal: {e}")
                time.sleep(10)

def signal_handler(sig, frame):
    """Handler para Ctrl+C"""
    print("\n🛑 Recebido sinal de parada...")
    sys.exit(0)

def main():
    """Função principal"""
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    # Criar e iniciar sistema
    ai_system = SAPP_AI_Main()
    ai_system.start()

if __name__ == "__main__":
    main()
