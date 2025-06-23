
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminProtectedRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any stale user data when accessing admin routes
    if (localStorage.getItem('user') || localStorage.getItem('currentUser')) {
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
    }
  }, []);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Check if there's a stored admin user
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          const userData = JSON.parse(adminUser);
          console.log('Found admin user in localStorage:', userData);
          
          // Verify admin user exists in database
          const { data: dbAdmin, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', userData.username)
            .eq('is_active', true)
            .single();

          if (!error && dbAdmin) {
            console.log('Admin verified in database:', dbAdmin);
            setIsAdmin(true);
          } else {
            console.log('Admin not found or inactive in database');
            localStorage.removeItem('adminUser');
            setIsAdmin(false);
          }
        } else {
          console.log('No admin user found in localStorage');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin auth:', error);
        // Clear potentially corrupted admin data
        localStorage.removeItem('adminUser');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
