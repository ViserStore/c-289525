import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';

interface BankAccountField {
  id: string;
  question: string;
  answer: string;
}

const AdminAddDepositGateway = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    minimum_amount: '',
    maximum_amount: '',
    fees_percentage: '',
    fees_fixed: '',
  });
  const [bankAccountFields, setBankAccountFields] = useState<BankAccountField[]>([
    { id: '1', question: 'Bank Name', answer: '' },
    { id: '2', question: 'Account Number', answer: '' },
    { id: '3', question: 'Account Holder Name', answer: '' },
    { id: '4', question: 'IBAN', answer: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare bank account configuration
      const bankAccountConfig = bankAccountFields.reduce((acc, field) => {
        if (field.question && field.answer) {
          acc[field.question.toLowerCase().replace(/\s+/g, '_')] = field.answer;
        }
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from('payment_gateways')
        .insert({
          name: formData.name,
          type: 'deposit',
          gateway_type: 'bank', // Default to bank since we removed the selection
          is_active: formData.is_active,
          minimum_amount: parseFloat(formData.minimum_amount) || 0,
          maximum_amount: formData.maximum_amount ? parseFloat(formData.maximum_amount) : null,
          fees_percentage: parseFloat(formData.fees_percentage) || 0,
          fees_fixed: parseFloat(formData.fees_fixed) || 0,
          configuration: {
            bank_account_details: bankAccountConfig,
            instructions: 'Transfer money to the bank account details shown below'
          }
        });

      if (error) throw error;

      console.log('Deposit gateway created successfully');
      navigate('/admin/payment-gateways');
    } catch (error) {
      console.error('Error creating deposit gateway:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBankField = () => {
    const newField: BankAccountField = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    };
    setBankAccountFields([...bankAccountFields, newField]);
  };

  const removeBankField = (id: string) => {
    setBankAccountFields(bankAccountFields.filter(field => field.id !== id));
  };

  const updateBankField = (id: string, key: 'question' | 'answer', value: string) => {
    setBankAccountFields(bankAccountFields.map(field => 
      field.id === id ? { ...field, [key]: value } : field
    ));
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
            <h1 className="text-3xl font-bold text-gray-900">Add Deposit Gateway</h1>
            <p className="text-gray-600">Configure a new payment gateway for deposits</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Gateway Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., JazzCash, EasyPaisa, Bank Transfer"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minimum_amount">Minimum Amount</Label>
                      <Input
                        id="minimum_amount"
                        type="number"
                        value={formData.minimum_amount}
                        onChange={(e) => handleInputChange('minimum_amount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maximum_amount">Maximum Amount</Label>
                      <Input
                        id="maximum_amount"
                        type="number"
                        value={formData.maximum_amount}
                        onChange={(e) => handleInputChange('maximum_amount', e.target.value)}
                        placeholder="100000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fees_percentage">Fee Percentage</Label>
                      <Input
                        id="fees_percentage"
                        type="number"
                        step="0.01"
                        value={formData.fees_percentage}
                        onChange={(e) => handleInputChange('fees_percentage', e.target.value)}
                        placeholder="2.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fees_fixed">Fixed Fee</Label>
                      <Input
                        id="fees_fixed"
                        type="number"
                        step="0.01"
                        value={formData.fees_fixed}
                        onChange={(e) => handleInputChange('fees_fixed', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Bank Account Details
                    <Button type="button" onClick={addBankField} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bankAccountFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Field Name (Question)</Label>
                        <Input
                          value={field.question}
                          onChange={(e) => updateBankField(field.id, 'question', e.target.value)}
                          placeholder="e.g., Bank Name, Account Number"
                        />
                      </div>
                      <div>
                        <Label>Value (Answer)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={field.answer}
                            onChange={(e) => updateBankField(field.id, 'answer', e.target.value)}
                            placeholder="e.g., EasyPaisa Bank, 1234567890"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeBankField(field.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active Status</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
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
                        <p className="text-sm text-gray-500">Deposit Gateway</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Min: ${formData.minimum_amount || '0'}</p>
                      <p>Max: ${formData.maximum_amount || '∞'}</p>
                      <p>Fee: {formData.fees_percentage}% + ${formData.fees_fixed || '0'}</p>
                    </div>
                    <div className="mt-3 text-xs">
                      <p className="font-semibold">Bank Details Preview:</p>
                      {bankAccountFields.filter(f => f.question && f.answer).map(field => (
                        <p key={field.id} className="text-gray-600">
                          {field.question}: {field.answer}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Creating...' : 'Create Deposit Gateway'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminAddDepositGateway;
