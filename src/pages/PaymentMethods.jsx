import React, { useState } from 'react';
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

export default function PaymentMethods() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deleteCardId, setDeleteCardId] = useState(null);

  const queryClient = useQueryClient();

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

  const addCardMutation = useMutation({
    mutationFn: async (cardData) => {
      return await base44.entities.PaymentCard.create(cardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      resetForm();
      setIsAddDialogOpen(false);
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PaymentCard.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      setIsEditDialogOpen(false);
      setEditingCard(null);
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId) => {
      return await base44.entities.PaymentCard.delete(cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
      setDeleteCardId(null);
    }
  });

  const setDefaultCardMutation = useMutation({
    mutationFn: async (cardId) => {
      // First, unset all default cards
      const updatePromises = cards.map(card => 
        base44.entities.PaymentCard.update(card.id, { isDefault: card.id === cardId })
      );
      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentCards'] });
    }
  });

  const getCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    if (cleaned.startsWith('6')) return 'discover';
    return 'other';
  };

  const resetForm = () => {
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    
    const [month, year] = expiryDate.split('/');
    const lastFour = cardNumber.replace(/\s/g, '').slice(-4);
    const brand = getCardBrand(cardNumber);

    addCardMutation.mutate({
      userId: user.id,
      cardholderName,
      lastFourDigits: lastFour,
      cardBrand: brand,
      expiryMonth: month,
      expiryYear: year,
      isDefault: cards.length === 0
    });
  };

  const handleEditCard = (e) => {
    e.preventDefault();
    
    if (!editingCard) return;

    const [month, year] = expiryDate.split('/');

    updateCardMutation.mutate({
      id: editingCard.id,
      data: {
        cardholderName,
        expiryMonth: month,
        expiryYear: year
      }
    });
  };

  const openEditDialog = (card) => {
    setEditingCard(card);
    setCardholderName(card.cardholderName);
    setExpiryDate(`${card.expiryMonth}/${card.expiryYear}`);
    setIsEditDialogOpen(true);
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiryDate(value);
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
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
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
                        onClick={() => openEditDialog(card)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
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
                <Label htmlFor="add-cardNumber">Card Number</Label>
                <Input
                  id="add-cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-expiryDate">Expiry Date</Label>
                  <Input
                    id="add-expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="add-cvv">CVV</Label>
                  <Input
                    id="add-cvv"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  disabled={addCardMutation.isPending}
                >
                  {addCardMutation.isPending ? 'Adding...' : 'Add Card'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Card Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Card Details</DialogTitle>
              <DialogDescription>
                Update your card information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCard} className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">•••• •••• •••• {editingCard?.lastFourDigits}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {editingCard?.cardBrand.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Card number cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="edit-cardholderName">Cardholder Name</Label>
                <Input
                  id="edit-cardholderName"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input
                  id="edit-expiryDate"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingCard(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                  disabled={updateCardMutation.isPending}
                >
                  {updateCardMutation.isPending ? 'Updating...' : 'Update Card'}
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