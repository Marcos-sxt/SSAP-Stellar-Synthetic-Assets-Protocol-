import { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Navigation } from '@/components/Layout/Navigation';
import { Dashboard } from '@/pages/Dashboard';
import { Trading } from '@/pages/Trading';
import { Portfolio } from '@/pages/Portfolio';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'trading':
        return <Trading />;
      case 'portfolio':
        return <Portfolio />;
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Analytics coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Settings coming soon</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-6 py-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
