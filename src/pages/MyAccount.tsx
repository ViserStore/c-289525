
import React from 'react';
import AppLayout from '@/components/AppLayout';
import AccountHeader from '@/components/MyAccount/AccountHeader';
import AccountOptions from '@/components/MyAccount/AccountOptions';

const MyAccount = () => {
  return (
    <AppLayout showHeader={false} className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/40 p-0">
      <div className="min-h-screen">
        <AccountHeader />
        <AccountOptions />
      </div>
    </AppLayout>
  );
};

export default MyAccount;
