
import React from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
  headerTitle?: string;
  className?: string;
}

const AppLayout = ({ 
  children, 
  showHeader = true, 
  showBottomNav = true,
  headerTitle,
  className = ""
}: AppLayoutProps) => {
  return (
    <div className="bg-gray-50 min-h-screen max-w-md mx-auto shadow-lg overflow-hidden relative">
      {showHeader && <Header pageTitle={headerTitle} />}
      <div className={`${showBottomNav ? 'pb-20' : 'pb-4'} ${className} min-h-screen`}>
        {children}
      </div>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
