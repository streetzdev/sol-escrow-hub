
import React, { useState } from 'react';
import WalletContextProvider from '@/components/WalletProvider';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Marketplace from '@/components/Marketplace';
import CreateEscrow from '@/components/CreateEscrow';
import MyEscrows from '@/components/MyEscrows';
import TransactionHistory from '@/components/TransactionHistory';

const Index = () => {
  const [activeTab, setActiveTab] = useState('marketplace');

  const renderContent = () => {
    switch (activeTab) {
      case 'marketplace':
        return <Marketplace />;
      case 'create':
        return <CreateEscrow />;
      case 'my-escrows':
        return <MyEscrows />;
      case 'history':
        return <TransactionHistory />;
      default:
        return <Marketplace />;
    }
  };

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="container mx-auto px-4 py-8">
          {renderContent()}
        </main>
      </div>
    </WalletContextProvider>
  );
};

export default Index;
