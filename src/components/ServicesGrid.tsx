import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  User,
  Percent,
  UserPlus,
  Gamepad2,
  Calendar,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface ServiceItem {
  icon: React.ReactElement;
  label: string;
  to: string;
  bgColor: string;
  isMore?: boolean;
}

const ServicesGrid = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const { settings: systemSettings } = useSystemSettings();

  const services: ServiceItem[] = [
    {
      icon: <TrendingUp size={18} className="text-blue-600" />,
      label: "Invest",
      to: "/investment-plans",
      bgColor: "bg-blue-50"
    },
    {
      icon: <ArrowDownLeft size={18} className="text-green-600" />,
      label: "Deposit",
      to: "/deposit",
      bgColor: "bg-green-50"
    },
    {
      icon: <ArrowUpRight size={18} className="text-red-600" />,
      label: "Withdraw",
      to: "/withdraw",
      bgColor: "bg-red-50"
    },
    {
      icon: <History size={18} className="text-purple-600" />,
      label: "Transaction",
      to: "/transactions",
      bgColor: "bg-purple-50"
    },
    {
      icon: <History size={18} className="text-blue-600" />,
      label: "Deposit History",
      to: "/deposit-history",
      bgColor: "bg-blue-50"
    },
    {
      icon: <History size={18} className="text-orange-600" />,
      label: "Withdraw History",
      to: "/withdraw-history",
      bgColor: "bg-orange-50"
    },
    {
      icon: <User size={18} className="text-indigo-600" />,
      label: "Profile",
      to: "/my-account",
      bgColor: "bg-indigo-50"
    },
    {
      icon: <Percent size={18} className="text-emerald-600" />,
      label: "Commission",
      to: "/commission",
      bgColor: "bg-emerald-50"
    },
    {
      icon: <UserPlus size={18} className="text-pink-600" />,
      label: "Invite & Earn",
      to: "/invite-earn",
      bgColor: "bg-pink-50"
    },
    {
      icon: <Gamepad2 size={18} className="text-purple-600" />,
      label: `${systemSettings.currencySymbol}1 Game`,
      to: "/game",
      bgColor: "bg-purple-50"
    },
    {
      icon: <Users size={18} className="text-teal-600" />,
      label: "Our Team",
      to: "/team",
      bgColor: "bg-teal-50"
    }
  ];

  const itemsPerPage = 9;
  const totalPages = Math.ceil(services.length / itemsPerPage);

  const getCurrentPageServices = (): ServiceItem[] => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentServices = services.slice(startIndex, endIndex);

    if (currentPage < totalPages - 1 && currentServices.length === itemsPerPage) {
      currentServices[8] = {
        icon: <Calendar size={18} className="text-gray-600" />,
        label: "See More",
        to: "#",
        bgColor: "bg-gray-50",
        isMore: true
      };
    }

    return currentServices;
  };

  const handleSeeMore = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleGoBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentServices = getCurrentPageServices();

  return (
    <div className="px-4 py-2 pb-24">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
          More with {systemSettings.siteName.toLowerCase()}
        </h2>
        {currentPage > 0 && (
          <button
            onClick={handleGoBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Go Back
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {currentServices.map((service, index) =>
            service.isMore ? (
              <button
                key={index}
                onClick={handleSeeMore}
                className="flex flex-col items-center justify-center group"
              >
                <div className={`mb-2 sm:mb-3 ${service.bgColor} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 group-hover:shadow-md transition-all duration-200 group-hover:scale-110`}>
                  {service.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-center text-gray-700 px-1 leading-tight group-hover:text-gray-900 transition-colors line-clamp-2">
                  {service.label}
                </div>
              </button>
            ) : (
              <Link
                to={service.to}
                key={index}
                className="flex flex-col items-center justify-center group"
              >
                <div className={`mb-2 sm:mb-3 ${service.bgColor} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 group-hover:shadow-md transition-all duration-200 group-hover:scale-110`}>
                  {service.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] font-medium text-center text-gray-700 px-1 leading-tight group-hover:text-gray-900 transition-colors line-clamp-2">
                  {service.label}
                </div>
              </Link>
            )
          )}
        </div>

        <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
          {Array.from({ length: totalPages }, (_, index) => (
            <div
              key={index}
              className={`h-1.5 sm:h-2 rounded-full shadow-sm transition-all duration-300 ${
                index === currentPage
                  ? 'w-6 sm:w-8 bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'w-1.5 sm:w-2 bg-gray-300'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesGrid;
