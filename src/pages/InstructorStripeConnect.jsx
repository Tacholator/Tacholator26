import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export default function InstructorStripeConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor, isLoading } = useQuery({
    queryKey: ['instructor', user?.id],
    queryFn: async () => {
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      return instructors[0] || null;
    },
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = window.location.origin;
      const response = await base44.functions.invoke('createStripeConnectLink', {
        refreshUrl: `${baseUrl}${window.location.pathname}?refresh=true`,
        returnUrl: `${baseUrl}${window.location.pathname}?success=true`
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Connection error:', error);
      setIsConnecting(false);
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    connectMutation.mutate();
  };

  // Check URL params for success/refresh
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      queryClient.invalidateQueries(['instructor']);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('refresh') === 'true') {
      setIsConnecting(false);
    }
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const isConnected = instructor?.stripeAccountStatus === 'active';
  const isPending = instructor?.stripeAccountStatus === 'pending';
  const isRestricted = instructor?.stripeAccountStatus === 'restricted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Payment Setup</h1>
        <p className="text-slate-600 mb-8">Connect your Stripe account to receive payments from lessons</p>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Stripe Connect Status
                </CardTitle>
                <CardDescription>Manage your payment account settings</CardDescription>
              </div>
              {isConnected && (
                <Badge className="bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-100 text-amber-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
              {isRestricted && (
                <Badge className="bg-rose-100 text-rose-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Restricted
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!instructor?.stripeAccountId && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  You need to connect your Stripe account to receive payments from pupils. 
                  This is a secure process managed by Stripe.
                </AlertDescription>
              </Alert>
            )}

            {isConnected && (
              <Alert className="border-emerald-200 bg-emerald-50/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Your Stripe account is connected and ready to receive payments.
                  {instructor.stripeOnboardingCompletedAt && (
                    <span className="block text-sm mt-1 text-emerald-600">
                      Connected on {new Date(instructor.stripeOnboardingCompletedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isPending && (
              <Alert className="border-amber-200 bg-amber-50/50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Your Stripe account setup is incomplete. Click below to continue the onboarding process.
                </AlertDescription>
              </Alert>
            )}

            {isRestricted && (
              <Alert className="border-rose-200 bg-rose-50/50">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <AlertDescription className="text-rose-800">
                  Your Stripe account has been restricted. Please complete the required actions in your Stripe dashboard.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
                <h3 className="font-medium text-slate-800">What you'll need:</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>Personal identification (passport or driver's license)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>Bank account details for receiving payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">•</span>
                    <span>Business information (if applicable)</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || connectMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {isConnecting || connectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting to Stripe...
                  </>
                ) : isConnected ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Stripe Account
                  </>
                ) : isPending ? (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Continue Stripe Setup
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>

              {instructor?.stripeAccountId && (
                <p className="text-xs text-center text-slate-500">
                  Stripe Account ID: {instructor.stripeAccountId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            About Stripe Connect
          </h3>
          <p className="text-sm text-blue-800">
            Stripe Connect is a secure payment processing service. Your financial data is handled by Stripe, 
            not stored on this platform. You'll be redirected to Stripe's secure onboarding process.
          </p>
        </div>
      </div>
    </div>
  );
}