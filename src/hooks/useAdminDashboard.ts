
import { adminService } from '@/services/adminService';
import { useOptimizedQuery } from './useOptimizedQuery';

export const useAdminDashboard = () => {
  return useOptimizedQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 10000,
    cacheTime: 30000
  });
};
