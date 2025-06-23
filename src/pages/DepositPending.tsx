
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '../components/AppLayout';

const DepositPending = () => {
  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-3 pt-6 pb-4 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Link to="/" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </Link>
                <h1 className="text-lg font-bold text-white">Deposit Status</h1>
              </div>
            </div>
            
            {/* Compact Status */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 text-center">
              <Clock className="w-10 h-10 text-amber-200 mx-auto mb-2" />
              <h2 className="text-white text-lg font-bold mb-1">Deposit Pending</h2>
              <p className="text-emerald-100 text-xs">Your deposit is being verified by our team</p>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-3 space-y-4 -mt-2">
          {/* Status Card */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Submission Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-800 font-semibold mb-2 text-sm">What happens next?</p>
                <ul className="space-y-1.5 text-xs text-green-700">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Your payment details and screenshot have been submitted
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Our team will verify your payment within 2-24 hours
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    You'll receive a notification once your deposit is confirmed
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    Funds will be added to your account balance
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-800 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-blue-600" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="space-y-2 text-xs text-blue-800">
                  <div>
                    <p className="font-semibold">Processing Time:</p>
                    <p>Deposits are typically processed within 2-24 hours during business hours.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Track Your Deposit:</p>
                    <p>You can check the status of your deposit in the Deposit History section.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Need Help?</p>
                    <p>Contact our support team if you have any questions about your deposit.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Action Buttons */}
          <div className="space-y-2">
            <Link to="/" className="block">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 rounded-xl text-sm">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            
            <Link to="/deposit-history" className="block">
              <Button 
                variant="outline" 
                className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold py-3 rounded-xl text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                View Deposit History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DepositPending;
