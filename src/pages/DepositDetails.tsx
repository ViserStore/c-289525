import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Check, Clock, FileImage, CreditCard, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ImageKitService } from '@/utils/imagekit';
import { formatCurrencyWithSettings } from '@/lib/utils';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import AppLayout from '../components/AppLayout';

interface PaymentGateway {
  id: string;
  name: string;
  minimum_amount: number;
  maximum_amount: number;
  fees_percentage: number;
  fees_fixed: number;
  configuration: any;
}

const DepositDetails = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: systemSettings } = useSystemSettings();
  
  const gatewayId = searchParams.get('gateway');
  const amount = searchParams.get('amount');
  const planId = searchParams.get('planId');
  const planName = searchParams.get('planName');
  const isFromInvestment = Boolean(planId && planName);
  
  const form = useForm({
    defaultValues: {
      amount: amount || '',
      transactionId: '',
      paymentMethod: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (gatewayId) {
      fetchGateway();
    }
  }, [gatewayId]);

  const fetchGateway = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('id', gatewayId)
        .single();

      if (error) throw error;
      
      setGateway(data);
      form.setValue('paymentMethod', data.name);
    } catch (error) {
      console.error('Error fetching gateway:', error);
      toast.error('Failed to load payment gateway details');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      toast.success('Screenshot uploaded successfully!');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const onSubmit = async (values: any) => {
    if (!user) {
      toast.error('Please login to submit deposit');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to ImageKit
      let screenshotUrl = '';
      try {
        screenshotUrl = await ImageKitService.uploadImage(uploadedFile, 'deposits');
      } catch (error) {
        console.error('ImageKit upload failed:', error);
        toast.error('Failed to upload screenshot. Please try again.');
        return;
      }

      // Create deposit record
      const depositData = {
        user_id: user.id,
        amount: parseFloat(values.amount),
        payment_method: values.paymentMethod,
        transaction_id: values.transactionId,
        screenshot_url: screenshotUrl,
        notes: values.notes,
        status: 'pending',
        ...(isFromInvestment && {
          notes: `${values.notes ? values.notes + ' | ' : ''}Investment Plan: ${planName} (ID: ${planId})`
        })
      };

      const { data: depositRecord, error: depositError } = await supabase
        .from('deposits')
        .insert(depositData)
        .select()
        .single();

      if (depositError) {
        console.error('Deposit creation error:', depositError);
        toast.error('Failed to submit deposit. Please try again.');
        return;
      }

      // Create transaction record
      const transactionDescription = isFromInvestment 
        ? `Investment deposit for ${planName} plan`
        : `Deposit via ${values.paymentMethod}`;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: parseFloat(values.amount),
          status: 'pending',
          reference_type: 'deposit',
          reference_id: depositRecord.id,
          description: transactionDescription
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
      }

      toast.success('Deposit submitted successfully for verification!');
      navigate('/deposit-pending');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankDetails = gateway?.configuration?.bank_account_details || {};

  return (
    <AppLayout showHeader={false} showBottomNav={true}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-2 pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Link to="/deposit" className="mr-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <h1 className="text-base font-bold text-white">Deposit Details</h1>
            </div>
            <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Compact Status */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 border border-white/30">
            <div className="flex items-center">
              <Clock className="w-3 h-3 text-amber-200 mr-2" />
              <div>
                <p className="text-white font-semibold text-xs">Pending Verification</p>
                <p className="text-emerald-100 text-xs">Complete payment and upload proof below</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 p-2 space-y-3">
          {/* Compact Payment Instructions */}
          <Card className="border-0 shadow-lg bg-white rounded-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-gray-800 flex items-center">
                <Info className="w-3 h-3 mr-1 text-blue-600" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <h3 className="font-bold text-blue-800 mb-1 text-xs">Step-by-Step Guide:</h3>
                <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-700">
                  <li>Transfer money to the bank account details shown below</li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Fill in the payment details form</li>
                  <li>Upload the screenshot as proof</li>
                  <li>Submit for verification</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Compact Bank Account Details */}
          <Card className="border-0 shadow-lg bg-white rounded-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-gray-800 flex items-center">
                <CreditCard className="w-3 h-3 mr-1 text-green-600" />
                {gateway?.name || 'Payment Gateway'} - Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2">
                <div className="space-y-1">
                  {Object.entries(bankDetails).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-1.5 bg-white rounded border border-green-100">
                      <div>
                        <p className="text-xs text-gray-600">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className="font-bold text-gray-800 font-mono text-xs">{value as string}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(value as string, key.split('_').join(' '))}
                        className="text-green-600 border-green-300 hover:bg-green-50 h-5 w-5 p-0"
                      >
                        <Copy className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                  
                  {Object.keys(bankDetails).length === 0 && (
                    <div className="text-center py-2 text-gray-500 text-xs">
                      No bank account details available for this gateway
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Payment Details Form */}
          <Card className="border-0 shadow-lg bg-white rounded-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-gray-800 flex items-center">
                <CreditCard className="w-3 h-3 mr-1 text-blue-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Amount ({systemSettings.currencySymbol}) *
                </label>
                <Input
                  type="number"
                  placeholder="Enter deposit amount"
                  {...form.register('amount', { required: true })}
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-lg h-8 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Transaction ID
                </label>
                <Input
                  placeholder="Enter transaction ID"
                  {...form.register('transactionId')}
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-lg h-8 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Payment Method *
                </label>
                <Input
                  value={gateway?.name || ''}
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-lg bg-gray-50 h-8 text-xs"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Additional Notes
                </label>
                <Textarea
                  placeholder="Any additional information..."
                  {...form.register('notes')}
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-lg text-xs resize-none h-12"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compact Screenshot Upload */}
          <Card className="border-0 shadow-lg bg-white rounded-lg">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-gray-800 flex items-center">
                <FileImage className="w-3 h-3 mr-1 text-purple-600" />
                Upload Payment Screenshot *
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-3 text-center">
                  <Upload className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <h3 className="text-xs font-semibold text-gray-700 mb-0.5">
                    Upload Payment Proof
                  </h3>
                  <p className="text-gray-500 mb-1 text-xs">
                    Upload screenshot of payment confirmation
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs"
                    disabled={isSubmitting}
                  >
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-emerald-300 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                      <span className="font-semibold text-gray-700 text-xs">Screenshot Uploaded</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="text-xs h-5"
                      disabled={isSubmitting}
                    >
                      Change
                    </Button>
                  </div>
                  {previewUrl && (
                    <div className="rounded overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Payment screenshot"
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-0.5">{uploadedFile.name}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Submit Button */}
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-2 rounded-lg text-sm"
          >
            <Check className="w-3 h-3 mr-1" />
            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default DepositDetails;
