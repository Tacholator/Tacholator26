import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function PaymentMethods() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor } = useQuery({
    queryKey: ['myInstructorProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      return instructors.length > 0 ? instructors[0] : null;
    },
    enabled: !!user?.id
  });

  const handleAddCard = (e) => {
    e.preventDefault();
    // Card addition logic will be implemented
    console.log('Add card:', { cardNumber, expiryDate, cvv, cardholderName });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('InstructorPayments')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#071739]">Payment Methods</h1>
            <p className="text-slate-600 mt-2">Manage your payment and payout methods</p>
          </div>
        </div>

        {/* Add Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#F7B602]" />
              Your Payment Cards
            </CardTitle>
            <CardDescription>
              Add cards to make payments for goods and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-3">Saved Cards</p>
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No cards added yet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accept Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#F7B602]" />
              Accept Payments from Customers
            </CardTitle>
            <CardDescription>
              Set up your account to receive payments from pupils
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructor?.stripeAccountStatus === 'not_connected' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-amber-800">
                    Set up your payment details to receive payouts from lesson payments
                  </span>
                  <Link to={createPageUrl('InstructorStripeConnect')}>
                    <Button size="sm" className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]">
                      Set Up Now
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {instructor?.stripeAccountStatus === 'pending' && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-amber-800">
                    Complete your payment setup to start receiving payouts
                  </span>
                  <Link to={createPageUrl('InstructorStripeConnect')}>
                    <Button size="sm" variant="outline">
                      Complete Setup
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {instructor?.stripeAccountStatus === 'active' && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-emerald-800">
                    Your payment account is active and ready to receive payouts
                  </span>
                  <Link to={createPageUrl('InstructorStripeConnect')}>
                    <Button size="sm" variant="ghost" className="text-emerald-700 hover:text-emerald-800">
                      Manage Account
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {instructor?.stripeAccountStatus === 'restricted' && (
              <Alert className="border-rose-200 bg-rose-50">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-rose-800">
                    Your payment account requires attention. Please complete the required actions.
                  </span>
                  <Link to={createPageUrl('InstructorStripeConnect')}>
                    <Button size="sm" variant="destructive">
                      Fix Issues
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-slate-900">How it works</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <span>Connect your bank account to receive payments directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <span>Pupils can pay for lessons securely through the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <span>Automatic payouts to your bank account</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}