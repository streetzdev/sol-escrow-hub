
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Store, User, History } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'create', label: 'Create Escrow', icon: Plus },
    { id: 'my-escrows', label: 'My Escrows', icon: User },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`flex items-center space-x-2 rounded-none border-b-2 border-transparent px-4 py-3 ${
                  activeTab === tab.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:border-muted-foreground/20'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
