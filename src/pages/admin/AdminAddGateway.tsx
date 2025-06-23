
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, CreditCard, Wallet, Building2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

const AdminAddGateway = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    description: '',
    isActive: true,
    minAmount: '',
    maxAmount: '',
    processingFee: '',
    feeType: 'fixed',
    apiKey: '',
    secretKey: '',
    webhookUrl: '',
    supportedCurrencies: ['PKR'],
    processingTime: '',
    instructions: '',
  });

  const gatewayTypes = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'digital_wallet', label: 'Digital Wallet', icon: Wallet },
    { value: 'card_payment', label: 'Card Payment', icon: CreditCard },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating new gateway:', formData);
    // Handle form submission
    navigate('/admin/payment-gateways');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/payment-gateways')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gateways
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Payment Gateway</h1>
            <p className="text-gray-600">Configure a new payment gateway for deposits and withdrawals</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Gateway Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., JazzCash, EasyPaisa"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Gateway Type</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gateway type" />
                        </SelectTrigger>
                        <SelectContent>
                          {gatewayTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center">
                                <type.icon className="w-4 h-4 mr-2" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Deposit & Withdrawal</SelectItem>
                        <SelectItem value="deposit">Deposit Only</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the payment gateway"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="minAmount">Minimum Amount</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        value={formData.minAmount}
                        onChange={(e) => handleInputChange('minAmount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAmount">Maximum Amount</Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        value={formData.maxAmount}
                        onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                        placeholder="100000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="processingTime">Processing Time</Label>
                      <Input
                        id="processingTime"
                        value={formData.processingTime}
                        onChange={(e) => handleInputChange('processingTime', e.target.value)}
                        placeholder="e.g., Instant, 1-3 hours"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="processingFee">Processing Fee</Label>
                      <Input
                        id="processingFee"
                        type="number"
                        value={formData.processingFee}
                        onChange={(e) => handleInputChange('processingFee', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="feeType">Fee Type</Label>
                      <Select value={formData.feeType} onValueChange={(value) => handleInputChange('feeType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={formData.secretKey}
                      onChange={(e) => handleInputChange('secretKey', e.target.value)}
                      placeholder="Enter secret key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={formData.webhookUrl}
                      onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                      placeholder="https://yoursite.com/webhook"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="instructions">Payment Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      placeholder="Step-by-step instructions for users on how to use this payment method"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings & Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active Status</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>
                  <div>
                    <Label>Supported Currencies</Label>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        PKR
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{formData.name || 'Gateway Name'}</h4>
                        <p className="text-sm text-gray-500">{formData.processingTime || 'Processing time'}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Min: Rs. {formData.minAmount || '0'}</p>
                      <p>Max: Rs. {formData.maxAmount || '∞'}</p>
                      <p>Fee: Rs. {formData.processingFee || '0'} {formData.feeType === 'percentage' ? '%' : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button type="submit" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Create Gateway
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  Test Connection
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminAddGateway;
