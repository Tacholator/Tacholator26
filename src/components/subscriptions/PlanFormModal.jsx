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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

export default function PlanFormModal({ open, onClose, plan }) {
  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    role: 'instructor',
    trialDays: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    discountYearlyPercent: 0,
    pricingModel: 'flat',
    isActive: true,
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (plan) {
      setFormData({
        planId: plan.planId || '',
        name: plan.name || '',
        role: plan.role || 'instructor',
        trialDays: plan.trialDays || 0,
        monthlyPrice: plan.monthlyPrice || 0,
        yearlyPrice: plan.yearlyPrice || 0,
        discountYearlyPercent: plan.discountYearlyPercent || 0,
        pricingModel: plan.pricingModel || 'flat',
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        stripePriceIdMonthly: plan.stripePriceIdMonthly || '',
        stripePriceIdYearly: plan.stripePriceIdYearly || '',
      });
    } else {
      setFormData({
        planId: '',
        name: '',
        role: 'instructor',
        trialDays: 0,
        monthlyPrice: 0,
        yearlyPrice: 0,
        discountYearlyPercent: 0,
        pricingModel: 'flat',
        isActive: true,
        stripePriceIdMonthly: '',
        stripePriceIdYearly: '',
      });
    }
  }, [plan, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (plan) {
        return base44.entities.SubscriptionPlan.update(plan.id, data);
      } else {
        return base44.entities.SubscriptionPlan.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptionPlans']);
      toast({ title: plan ? 'Plan updated successfully' : 'Plan created successfully' });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planId">Plan ID</Label>
              <Input
                id="planId"
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                placeholder="e.g., instructor_pro"
                required
                disabled={!!plan}
              />
            </div>

            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Instructor Pro"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">User Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="guide_user">Guide User</SelectItem>
                  <SelectItem value="test_route_user">Test Route User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricingModel">Pricing Model</Label>
              <Select value={formData.pricingModel} onValueChange={(value) => setFormData({ ...formData, pricingModel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="per_test_centre">Per Test Centre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="monthlyPrice">Monthly Price (£)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                step="0.01"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="yearlyPrice">Yearly Price (£)</Label>
              <Input
                id="yearlyPrice"
                type="number"
                step="0.01"
                value={formData.yearlyPrice}
                onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="discountYearlyPercent">Yearly Discount (%)</Label>
              <Input
                id="discountYearlyPercent"
                type="number"
                value={formData.discountYearlyPercent}
                onChange={(e) => setFormData({ ...formData, discountYearlyPercent: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="trialDays">Trial Days</Label>
            <Input
              id="trialDays"
              type="number"
              value={formData.trialDays}
              onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stripePriceIdMonthly">Stripe Monthly Price ID</Label>
              <Input
                id="stripePriceIdMonthly"
                value={formData.stripePriceIdMonthly}
                onChange={(e) => setFormData({ ...formData, stripePriceIdMonthly: e.target.value })}
                placeholder="price_..."
              />
            </div>

            <div>
              <Label htmlFor="stripePriceIdYearly">Stripe Yearly Price ID</Label>
              <Input
                id="stripePriceIdYearly"
                value={formData.stripePriceIdYearly}
                onChange={(e) => setFormData({ ...formData, stripePriceIdYearly: e.target.value })}
                placeholder="price_..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Plan is active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : (plan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}