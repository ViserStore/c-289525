import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ArrowUpDown, 
  TrendingUp,
  Bell,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Gamepad2,
  Cog,
  Award
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Initialize expanded items based on current path
  const getInitialExpandedItems = () => {
    const path = location.pathname;
    const expanded = [];
    if (path.includes('/admin/deposits')) expanded.push('deposits');
    if (path.includes('/admin/withdrawals')) expanded.push('withdrawals');
    return expanded;
  };
  
  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpandedItems());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { 
      icon: CreditCard, 
      label: 'Deposits', 
      path: '/admin/deposits',
      subItems: [
        { label: 'All Deposits', path: '/admin/deposits/all' },
        { label: 'Pending', path: '/admin/deposits/pending' },
        { label: 'Approved', path: '/admin/deposits/approved' },
        { label: 'Rejected', path: '/admin/deposits/rejected' },
      ]
    },
    { 
      icon: ArrowUpDown, 
      label: 'Withdrawals', 
      path: '/admin/withdrawals',
      subItems: [
        { label: 'All Withdrawals', path: '/admin/withdrawals/all' },
        { label: 'Pending', path: '/admin/withdrawals/pending' },
        { label: 'Approved', path: '/admin/withdrawals/approved' },
        { label: 'Rejected', path: '/admin/withdrawals/rejected' },
      ]
    },
    { icon: ArrowUpDown, label: 'Transactions', path: '/admin/transactions' },
    { icon: TrendingUp, label: 'Investment Plans', path: '/admin/investment-plans' },
    { icon: Award, label: 'User Level Settings', path: '/admin/user-level-settings' },
    { icon: Gamepad2, label: 'Game Settings', path: '/admin/settings/game' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: UserCheck, label: 'Referral Settings', path: '/admin/referral-settings' },
    { icon: Cog, label: 'General Settings', path: '/admin/general-settings' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 lg:p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 lg:p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems.includes(item.label.toLowerCase());
          const isItemActive = isActive(item.path);

          return (
            <div key={item.path} className="mb-1">
              <div
                className={`flex items-center px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer rounded-lg group ${
                  isItemActive
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => {
                  if (hasSubItems) {
                    toggleExpanded(item.label.toLowerCase());
                  } else {
                    navigate(item.path);
                    if (isMobile) setSidebarOpen(false);
                  }
                }}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {hasSubItems && (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )
                )}
              </div>
              
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={`block px-8 py-2 text-sm transition-colors rounded-lg ${
                        location.pathname === subItem.path
                          ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-white">
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="w-full flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            size="sm"
            className="p-2"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Content - Full Width */}
        <div className="w-full">
          {children}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Desktop Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
