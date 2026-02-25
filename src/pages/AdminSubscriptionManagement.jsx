import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, CreditCard, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PlanFormModal from '@/components/subscriptions/PlanFormModal';
import TestCentreFormModal from '@/components/subscriptions/TestCentreFormModal';
import UserSubscriptionModal from '@/components/subscriptions/UserSubscriptionModal';

export default function AdminSubscriptionManagement() {
  const [activeTab, setActiveTab] = useState('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTestCentreModal, setShowTestCentreModal] = useState(false);
  const [showUserSubModal, setShowUserSubModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTestCentre, setSelectedTestCentre] = useState(null);
  const [selectedUserSub, setSelectedUserSub] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
  });

  const { data: userSubscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date'),
  });

  const { data: testCentres = [] } = useQuery({
    queryKey: ['testCentres'],
    queryFn: () => base44.entities.TestCentre.list(),
  });

  const { data: testCentreAccess = [] } = useQuery({
    queryKey: ['testCentreAccess'],
    queryFn: () => base44.entities.UserTestCentreAccess.list('-created_date'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Delete mutations
  const deletePlanMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptionPlans']);
      toast({ title: 'Plan deleted successfully' });
    },
  });

  const deleteTestCentreMutation = useMutation({
    mutationFn: (id) => base44.entities.TestCentre.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['testCentres']);
      toast({ title: 'Test centre deleted successfully' });
    },
  });

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-slate-100 text-slate-800',
      none: 'bg-slate-100 text-slate-800',
    };
    return <Badge className={colors[status] || 'bg-slate-100 text-slate-800'}>{status}</Badge>;
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.email || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
          <p className="text-slate-600 mt-1">Manage subscription plans, user subscriptions, and test centres</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Users className="w-4 h-4" />
              User Subscriptions
            </TabsTrigger>
            <TabsTrigger value="testcentres" className="gap-2">
              <MapPin className="w-4 h-4" />
              Test Centres
            </TabsTrigger>
          </TabsList>

          {/* Subscription Plans */}
          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Manage available subscription plans</CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedPlan(null); setShowPlanModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Pricing Model</TableHead>
                      <TableHead>Monthly Price</TableHead>
                      <TableHead>Yearly Price</TableHead>
                      <TableHead>Trial Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500">
                          No plans created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{plan.role}</Badge>
                          </TableCell>
                          <TableCell>{plan.pricingModel}</TableCell>
                          <TableCell>£{plan.monthlyPrice}</TableCell>
                          <TableCell>{plan.yearlyPrice ? `£${plan.yearlyPrice}` : '-'}</TableCell>
                          <TableCell>{plan.trialDays}</TableCell>
                          <TableCell>
                            {plan.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-800">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedPlan(plan); setShowPlanModal(true); }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deletePlanMutation.mutate(plan.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Subscriptions */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Subscriptions</CardTitle>
                    <CardDescription>View and manage user subscriptions</CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedUserSub(null); setShowUserSubModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Period End</TableHead>
                      <TableHead>Cancel at Period End</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500">
                          No subscriptions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      userSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{getUserEmail(sub.userId)}</TableCell>
                          <TableCell>{sub.planId || '-'}</TableCell>
                          <TableCell>{sub.billingPeriod || '-'}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            {sub.currentPeriodEndAt 
                              ? new Date(sub.currentPeriodEndAt).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {sub.cancelAtPeriodEnd ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-800">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedUserSub(sub); setShowUserSubModal(true); }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Centres */}
          <TabsContent value="testcentres">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Test Centres</CardTitle>
                    <CardDescription>Manage test centres for location-based subscriptions</CardDescription>
                  </div>
                  <Button onClick={() => { setSelectedTestCentre(null); setShowTestCentreModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Centre
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Town</TableHead>
                      <TableHead>Postcode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active Subscriptions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testCentres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500">
                          No test centres added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      testCentres.map((centre) => {
                        const activeCount = testCentreAccess.filter(
                          a => a.testCentreId === centre.id && a.status === 'active'
                        ).length;
                        return (
                          <TableRow key={centre.id}>
                            <TableCell className="font-medium">{centre.name}</TableCell>
                            <TableCell>{centre.town}</TableCell>
                            <TableCell>{centre.postcode || '-'}</TableCell>
                            <TableCell>
                              {centre.isActive ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-800">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{activeCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setSelectedTestCentre(centre); setShowTestCentreModal(true); }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteTestCentreMutation.mutate(centre.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <PlanFormModal
        open={showPlanModal}
        onClose={() => { setShowPlanModal(false); setSelectedPlan(null); }}
        plan={selectedPlan}
      />

      <TestCentreFormModal
        open={showTestCentreModal}
        onClose={() => { setShowTestCentreModal(false); setSelectedTestCentre(null); }}
        testCentre={selectedTestCentre}
      />

      <UserSubscriptionModal
        open={showUserSubModal}
        onClose={() => { setShowUserSubModal(false); setSelectedUserSub(null); }}
        subscription={selectedUserSub}
        users={users}
        plans={plans}
      />
    </div>
  );
}