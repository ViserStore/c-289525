
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ToastProvider from "./components/ToastProvider";

// Import components
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyAccount from "./pages/MyAccount";
import ProfileEdit from "./pages/ProfileEdit";
import UserProfile from "./pages/UserProfile";
import AccountLevel from "./pages/AccountLevel";
import Deposit from "./pages/Deposit";
import DepositDetails from "./pages/DepositDetails";
import DepositHistory from "./pages/DepositHistory";
import DepositPending from "./pages/DepositPending";
import Withdraw from "./pages/Withdraw";
import WithdrawHistory from "./pages/WithdrawHistory";
import WithdrawPending from "./pages/WithdrawPending";
import Transactions from "./pages/Transactions";
import Invest from "./pages/Invest";
import InvestmentPlans from "./pages/InvestmentPlans";
import InvestmentProfile from "./pages/InvestmentProfile";
import InviteEarn from "./pages/InviteEarn";
import Team from "./pages/Team";
import Commission from "./pages/Commission";
import CommissionHistory from "./pages/CommissionHistory";
import Notifications from "./pages/Notifications";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminEditUser from "./pages/admin/AdminEditUser";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminDepositDetails from "./pages/admin/AdminDepositDetails";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminWithdrawalDetails from "./pages/admin/AdminWithdrawalDetails";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminInvestmentPlans from "./pages/admin/AdminInvestmentPlans";
import AdminCreateInvestmentPlan from "./pages/admin/AdminCreateInvestmentPlan";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReferralSettings from "./pages/admin/AdminReferralSettings";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminGeneralSettings from "./pages/admin/AdminGeneralSettings";
import AdminPaymentGateways from "./pages/admin/AdminPaymentGateways";
import AdminAddDepositGateway from "./pages/admin/AdminAddDepositGateway";
import AdminAddWithdrawGateway from "./pages/admin/AdminAddWithdrawGateway";
import AdminAddGateway from "./pages/admin/AdminAddGateway";
import AdminGameSettings from "./pages/admin/AdminGameSettings";
import AdminImageKitSettings from "./pages/admin/AdminImageKitSettings";
import AdminUserLevelSettings from "./pages/admin/AdminUserLevelSettings";

const queryClient = new QueryClient();

import UserDetailsPage from '@/pages/admin/UserDetailsPage';
import ReferralSignup from './pages/ReferralSignup';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/ref/:referralCode" element={<ReferralSignup />} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminProtectedRoute />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<UserDetailsPage />} />
                <Route path="users/:userId/edit" element={<AdminEditUser />} />
                
                {/* Deposit routes with sublists */}
                <Route path="deposits" element={<AdminDeposits />} />
                <Route path="deposits/all" element={<AdminDeposits />} />
                <Route path="deposits/pending" element={<AdminDeposits />} />
                <Route path="deposits/approved" element={<AdminDeposits />} />
                <Route path="deposits/rejected" element={<AdminDeposits />} />
                <Route path="deposits/:id" element={<AdminDepositDetails />} />
                
                {/* Withdrawal routes with sublists */}
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="withdrawals/all" element={<AdminWithdrawals />} />
                <Route path="withdrawals/pending" element={<AdminWithdrawals />} />
                <Route path="withdrawals/approved" element={<AdminWithdrawals />} />
                <Route path="withdrawals/rejected" element={<AdminWithdrawals />} />
                <Route path="withdrawals/:id" element={<AdminWithdrawalDetails />} />
                
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="investment-plans" element={<AdminInvestmentPlans />} />
                <Route path="investment-plans/create" element={<AdminCreateInvestmentPlan />} />
                <Route path="investment-plans/edit/:id" element={<AdminCreateInvestmentPlan />} />
                <Route path="user-level-settings" element={<AdminUserLevelSettings />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="referral-settings" element={<AdminReferralSettings />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="general-settings" element={<AdminGeneralSettings />} />
                <Route path="settings/general" element={<AdminGeneralSettings />} />
                <Route path="settings/payment-gateways" element={<AdminPaymentGateways />} />
                <Route path="settings/payment-gateways/add-deposit" element={<AdminAddDepositGateway />} />
                <Route path="settings/payment-gateways/add-withdraw" element={<AdminAddWithdrawGateway />} />
                <Route path="settings/payment-gateways/add" element={<AdminAddGateway />} />
                <Route path="settings/game" element={<AdminGameSettings />} />
                <Route path="settings/imagekit" element={<AdminImageKitSettings />} />
              </Route>
              
              {/* Protected user routes */}
              <Route path="/*" element={<ProtectedRoute />}>
                <Route path="" element={<Index />} />
                <Route path="my-account" element={<MyAccount />} />
                <Route path="profile-edit" element={<ProfileEdit />} />
                <Route path="user-profile" element={<UserProfile />} />
                <Route path="account-level" element={<AccountLevel />} />
                <Route path="deposit" element={<Deposit />} />
                <Route path="deposit-details" element={<DepositDetails />} />
                <Route path="deposit-history" element={<DepositHistory />} />
                <Route path="deposit-pending" element={<DepositPending />} />
                <Route path="withdraw" element={<Withdraw />} />
                <Route path="withdraw-history" element={<WithdrawHistory />} />
                <Route path="withdraw-pending" element={<WithdrawPending />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="invest" element={<Invest />} />
                <Route path="investment-plans" element={<InvestmentPlans />} />
                <Route path="investment-profile" element={<InvestmentProfile />} />
                <Route path="invite-earn" element={<InviteEarn />} />
                <Route path="team" element={<Team />} />
                <Route path="commission" element={<Commission />} />
                <Route path="commission-history" element={<CommissionHistory />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="game" element={<Game />} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
