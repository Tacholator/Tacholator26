import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function UserSubscriptionModal({ open, onClose, subscription, users, plans }) {
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    billingPeriod: 'monthly',
    status: 'none',
    cancelAtPeriodEnd: false,
    currentPeriodEndAt: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (subscription) {
      setFormData({
        userId: subscription.userId || '',
        planId: subscription.planId || '',
        billingPeriod: subscription.billingPeriod || 'monthly',
        status: subscription.status || 'none',
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        currentPeriodEndAt: subscription.currentPeriodEndAt ? new Date(subscription.currentPeriodEndAt) : null,
      });
    } else {
      setFormData({
        userId: '',
        planId: '',
        billingPeriod: 'monthly',
        status: 'none',
        cancelAtPeriodEnd: false,
        currentPeriodEndAt: null,
      });
    }
  }, [subscription, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        currentPeriodEndAt: data.currentPeriodEndAt ? data.currentPeriodEndAt.toISOString() : null,
      };

      if (subscription) {
        return base44.entities.UserSubscription.update(subscription.id, payload);
      } else {
        return base44.entities.UserSubscription.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userSubscriptions']);
      toast({ title: subscription ? 'Subscription updated successfully' : 'Subscription created successfully' });
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{subscription ? 'Edit Subscription' : 'Create New Subscription'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="userId">User</Label>
            <Select 
              value={formData.userId} 
              onValueChange={(value) => setFormData({ ...formData, userId: value })}
              disabled={!!subscription}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email} ({user.full_name || 'No name'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="planId">Plan</Label>
            <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.planId}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billingPeriod">Billing Period</Label>
            <Select value={formData.billingPeriod} onValueChange={(value) => setFormData({ ...formData, billingPeriod: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="grace">Grace</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Current Period End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.currentPeriodEndAt ? format(formData.currentPeriodEndAt, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.currentPeriodEndAt}
                  onSelect={(date) => setFormData({ ...formData, currentPeriodEndAt: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="cancelAtPeriodEnd"
              checked={formData.cancelAtPeriodEnd}
              onCheckedChange={(checked) => setFormData({ ...formData, cancelAtPeriodEnd: checked })}
            />
            <Label htmlFor="cancelAtPeriodEnd">Cancel at period end</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (subscription ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}