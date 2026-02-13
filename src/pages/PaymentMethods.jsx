import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/components/ui/use-toast';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY is not set. Current env:', import.meta.env);
}

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : Promise.resolve(null);

export default function PaymentMethods() {
  const [cardElement, setCardElement] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteCardId, setDeleteCardId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await stripePromise;
      if (!stripeInstance) {
        console.error('❌ Stripe failed to initialize. Check VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
        toast({
          title: 'Payment System Error',
          description: 'Stripe is not configured. Please contact support.',
          variant: 'destructive'
        });
      }
      setStripe(stripeInstance);
    };
    initStripe();
  }, []);

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

  const { data: cards = [] } = useQuery({
    queryKey: ['paymentCards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.PaymentCard.filter({ userId: user.id });
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!stripe || !isAddDialogOpen) {
      if (cardElement) {
        setCardElement(null);
      }
      return;
    }

    let mounted = true;
    let cardInstance = null;

    // Wait for DOM and dialog animation
    const timer = setTimeout(() => {
      if (!mounted) return;
      
      const element = document.getElementById('card-element');
      if (!element) {
        console.warn('Card element not found in DOM');
        return;
      }

      // Clear any existing content
      element.innerHTML = '';

      try {
        const elements = stripe.elements();
        cardInstance = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#32325d',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a',
            },
          },
        });

        cardInstance.mount('#card-element');
        if (mounted) {
          setCardElement(cardInstance);
        }
      } catch (error) {
        console.error('Error mounting Stripe card element:', error);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (cardInstance) {
        try {
          cardInstance.unmount();
        } catch (error) {
          console.error('Error unmounting card element:', error);
        }
      }
    };
  }, [stripe, isAddDialogOpen]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    
    if (!stripe || !cardElement) return;

    setIsProcessing(true);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      // Call backend to attach payment method
      const response = await base44.functions.invoke('managePaymentMethod', {
        action: 'attach',
        paymentMethodId: paymentMethod.id
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Payment card added successfully'
        });
        queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
        setCardholderName('');
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add card',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const setDefaultCardMutation = useMutation({
    mutationFn: async (cardId) => {
      const response = await base44.functions.invoke('managePaymentMethod', {
        action: 'setDefault',
        cardId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      toast({
        title: 'Success',
        description: 'Default payment method updated'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set default card',
        variant: 'destructive'
      });
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId) => {
      const response = await base44.functions.invoke('managePaymentMethod', {
        action: 'delete',
        cardId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      setDeleteCardId(null);
      toast({
        title: 'Success',
        description: 'Payment card deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete card',
        variant: 'destructive'
      });
    }
  });

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F7B602]" />
                  Your Payment Cards
                </CardTitle>
                <CardDescription>
                  Add cards to make payments for goods and services
                </CardDescription>
              </div>
              <Button 
               onClick={() => setIsAddDialogOpen(true)}
               className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
               disabled={!stripe}
              >
               <Plus className="w-4 h-4 mr-2" />
               {stripe ? 'Add Card' : 'Loading...'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!stripe ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-slate-600 font-medium">Payment system is loading...</p>
                <p className="text-xs text-slate-500 mt-1">If this persists, Stripe may not be configured</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No cards added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div 
                    key={card.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            •••• {card.lastFourDigits}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {card.cardBrand.toUpperCase()}
                          </Badge>
                          {card.isDefault && (
                            <Badge className="bg-[#F7B602] text-[#071739] text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {card.cardholderName} • Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!card.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDefaultCardMutation.mutate(card.id)}
                          disabled={setDefaultCardMutation.isPending}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteCardId(card.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Card Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Card</DialogTitle>
              <DialogDescription>
                Enter your card details to add a new payment method
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <Label htmlFor="add-cardholderName">Cardholder Name</Label>
                <Input
                  id="add-cardholderName"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Card Details</Label>
                <div 
                  id="card-element" 
                  className="border rounded-md p-3 bg-white min-h-[44px] transition-opacity"
                  style={{ opacity: cardElement ? 1 : 0.5 }}
                ></div>
                {!stripe && (
                  <p className="text-xs text-amber-600 mt-2">⏳ Loading payment form...</p>
                )}
                {stripe && !cardElement && (
                  <p className="text-xs text-blue-600 mt-2">⏳ Initializing card input...</p>
                )}
                {stripe && cardElement && (
                  <p className="text-xs text-slate-500 mt-2">🔒 Secure payment powered by Stripe</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setCardholderName('');
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  disabled={isProcessing || !stripe || !cardElement}
                >
                  {isProcessing ? 'Adding...' : !stripe ? 'Loading...' : !cardElement ? 'Initializing...' : 'Add Card'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>



        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteCardId} onOpenChange={() => setDeleteCardId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment card? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCardMutation.mutate(deleteCardId)}
                className="bg-rose-600 hover:bg-rose-700"
                disabled={deleteCardMutation.isPending}
              >
                {deleteCardMutation.isPending ? 'Deleting...' : 'Delete Card'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Accept Payments - Only for Instructors */}
        {user?.role === 'admin' && (
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
        )}
      </div>
    </div>
  );
}