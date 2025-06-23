
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      icon: <ArrowDownLeft size={20} className="text-green-600" />,
      label: "Deposit",
      to: "/deposit",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100"
    },
    {
      icon: <ArrowUpRight size={20} className="text-red-600" />,
      label: "Withdraw",
      to: "/withdraw",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100"
    },
    {
      icon: <TrendingUp size={20} className="text-blue-600" />,
      label: "Investment",
      to: "/investment-plans",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100"
    },
  ];

  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.to}
            className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center transform hover:scale-105 border border-gray-100 min-h-[80px] sm:min-h-[100px]"
          >
            <div className={`mb-2 sm:mb-3 ${action.bgColor} ${action.hoverColor} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-colors duration-200 shadow-sm flex items-center justify-center`}>
              {action.icon}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-700 font-semibold text-center leading-tight px-1">{action.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
