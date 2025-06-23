
import React from 'react';
import { Home, Plus, User, TrendingUp, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomNavigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const navItems = [
    {
      icon: <Home size={isMobile ? 16 : 18} />,
      label: "Home",
      to: "/",
      isActive: currentPath === "/"
    },
    {
      icon: <Plus size={isMobile ? 16 : 18} />,
      label: "Add Money",
      to: "/deposit",
      isActive: currentPath === "/deposit"
    },
    {
      icon: <TrendingUp size={isMobile ? 16 : 18} />,
      label: "Invest",
      to: "/investment-plans",
      isActive: currentPath === "/investment-plans"
    },
    {
      icon: <History size={isMobile ? 16 : 18} />,
      label: "History",
      to: "/transactions",
      isActive: currentPath === "/transactions"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 shadow-2xl">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center py-2 px-4">
          {navItems.slice(0, 2).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          
          {/* Center action button */}
          <div className="relative -mt-5">
            <Link to="/my-account" className="block">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-xl border-4 border-white hover:scale-105 transition-transform">
                <User size={isMobile ? "20" : "24"} />
              </div>
            </Link>
          </div>
          
          {navItems.slice(2).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
  hasNotification?: boolean;
};

const NavItem = ({ icon, label, to, isActive = false, hasNotification = false }: NavItemProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Link to={to} className={`flex flex-col items-center ${isMobile ? 'px-1' : 'px-2'} py-1 transition-all duration-200 ${isActive ? 'text-green-500 transform scale-110' : 'text-gray-500 hover:text-gray-700'}`}>
      <div className="flex justify-center items-center relative">
        <div className={`flex justify-center items-center p-1 rounded-lg transition-all ${isActive ? 'bg-green-100' : ''}`}>
          {icon}
        </div>
        {hasNotification && (
          <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></div>
        )}
      </div>
      <span className={`text-[9px] sm:text-[10px] mt-0.5 text-center ${isActive ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </Link>
  );
};

export default BottomNavigation;
