
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';

interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  gateway_type: string;
  is_active: boolean;
  fees_percentage: number;
  fees_fixed: number;
  minimum_amount: number;
  maximum_amount: number;
}

const AdminPaymentGateways = () => {
  const navigate = useNavigate();
  const [depositGateways, setDepositGateways] = useState<PaymentGateway[]>([]);
  const [withdrawGateways, setWithdrawGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const deposits = data?.filter(gateway => gateway.type === 'deposit') || [];
      const withdrawals = data?.filter(gateway => gateway.type === 'withdraw') || [];

      setDepositGateways(deposits);
      setWithdrawGateways(withdrawals);
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGatewayStatus = async (id: string, type: 'deposit' | 'withdraw') => {
    try {
      const gateways = type === 'deposit' ? depositGateways : withdrawGateways;
      const gateway = gateways.find(g => g.id === id);
      
      if (!gateway) return;

      const { error } = await supabase
        .from('payment_gateways')
        .update({ is_active: !gateway.is_active })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (type === 'deposit') {
        setDepositGateways(prev => 
          prev.map(gateway => 
            gateway.id === id ? { ...gateway, is_active: !gateway.is_active } : gateway
          )
        );
      } else {
        setWithdrawGateways(prev => 
          prev.map(gateway => 
            gateway.id === id ? { ...gateway, is_active: !gateway.is_active } : gateway
          )
        );
      }
    } catch (error) {
      console.error('Error updating gateway status:', error);
    }
  };

  const GatewayCard = ({ gateway, type, onToggle }: any) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{gateway.name}</h3>
              <p className="text-sm text-gray-500">
                Fees: {gateway.fees_percentage > 0 ? `${gateway.fees_percentage}%` : `$${gateway.fees_fixed}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={gateway.is_active ? "default" : "secondary"}>
              {gateway.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={gateway.is_active}
              onCheckedChange={() => onToggle(gateway.id, type)}
            />
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Min Amount:</span>
            <span className="ml-2 font-medium">${gateway.minimum_amount}</span>
          </div>
          <div>
            <span className="text-gray-500">Max Amount:</span>
            <span className="ml-2 font-medium">
              {gateway.maximum_amount ? `$${gateway.maximum_amount}` : 'No limit'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-gray-600">Manage deposit and withdrawal payment methods</p>
        </div>

        <Tabs defaultValue="deposits" className="space-y-6">
          <TabsList>
            <TabsTrigger value="deposits">Deposit Gateways</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal Gateways</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Deposit Payment Methods</h2>
              <Button onClick={() => navigate('/admin/add-deposit-gateway')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Deposit Gateway
              </Button>
            </div>
            {depositGateways.map(gateway => (
              <GatewayCard 
                key={gateway.id} 
                gateway={gateway} 
                type="deposit"
                onToggle={toggleGatewayStatus}
              />
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Withdrawal Payment Methods</h2>
              <Button onClick={() => navigate('/admin/add-withdraw-gateway')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Withdraw Gateway
              </Button>
            </div>
            {withdrawGateways.map(gateway => (
              <GatewayCard 
                key={gateway.id} 
                gateway={gateway} 
                type="withdraw"
                onToggle={toggleGatewayStatus}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentGateways;
