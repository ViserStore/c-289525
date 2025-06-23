
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ReferralSignup = () => {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      // Redirect to signup with referral code as query parameter
      navigate(`/signup?ref=${referralCode}`, { replace: true });
    } else {
      // If no referral code, redirect to regular signup
      navigate('/signup', { replace: true });
    }
  }, [referralCode, navigate]);

  // Show minimal loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );
};

export default ReferralSignup;
