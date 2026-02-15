import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
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
  const [errorMessage, setErrorMessage] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: instructor, isLoading } = useQuery({
    queryKey: ['myInstructorProfile', user?.id],
    queryFn: async () => {
      const instructors = await base44.entities.Instructor.filter({ created_by: user.email });
      
      if (instructors.length > 0) {
        return instructors[0];
      }
      
      // Auto-create instructor profile for admin users
      if (user.role === 'admin') {
        const newInstructor = await base44.entities.Instructor.create({
          name: user.full_name || user.email,
          phone: '',
          stripeAccountStatus: 'not_connected'
        });
        return newInstructor;
      }
      
      return null;
    },
    enabled: !!user
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Ensure we use HTTPS for production (Stripe requires it for live mode)
      let baseUrl = window.location.origin;
      
      // For production domains, force HTTPS
      if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
        baseUrl = baseUrl.replace('http://', 'https://');
      }
      
      const path = window.location.pathname || '/InstructorStripeConnect';
      
      console.log('Calling createStripeConnectLink with:', {
        refreshUrl: `${baseUrl}${path}?refresh=true`,
        returnUrl: `${baseUrl}${path}?success=true`
      });
      
      const response = await base44.functions.invoke('createStripeConnectLink', {
        refreshUrl: `${baseUrl}${path}?refresh=true`,
        returnUrl: `${baseUrl}${path}?success=true`
      });
      
      console.log('Response from createStripeConnectLink:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Success data:', data);
      if (data?.url) {
        setErrorMessage(null);
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No URL in response:', data);
        setErrorMessage('Failed to get Stripe connection URL. Please try again.');
        setIsConnecting(false);
      }
    },
    onError: (error) => {
      console.error('Connection error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect to Stripe';
      setErrorMessage(errorMsg);
      setIsConnecting(false);
    }
  });

  const handleConnect = () => {
    setIsConnecting(true);
    setErrorMessage(null);
    connectMutation.mutate();
  };

  // Check URL params for success/refresh
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      queryClient.invalidateQueries(['myInstructorProfile']);
      toast({
        title: '✓ Account Connected Successfully',
        description: 'Your Stripe account has been connected. You can now receive payouts from pupil lesson payments.',
        duration: 6000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('refresh') === 'true') {
      setIsConnecting(false);
    }
  }, [queryClient, toast]);

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
            {isConnected ? (
              <div className="space-y-4">
                <Alert className="border-emerald-200 bg-emerald-50/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    <div className="font-medium mb-2">✓ Account Connected Successfully</div>
                    <p className="text-sm">Your Stripe account is active and ready to receive payouts from pupil lesson payments.</p>
                    {instructor.stripeOnboardingCompletedAt && (
                      <span className="block text-xs mt-2 text-emerald-600">
                        Connected on {new Date(instructor.stripeOnboardingCompletedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-slate-800">Connected Account Details</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Account Status:</span>
                      <span className="font-medium text-emerald-600">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account ID:</span>
                      <span className="font-mono text-xs">{instructor.stripeAccountId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor Receives:</span>
                      <span className="font-medium">95%</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || connectMutation.isPending}
                  className="w-full bg-slate-600 hover:bg-slate-700"
                  size="lg"
                  variant="outline"
                >
                  {isConnecting || connectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Account Information
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {!instructor?.stripeAccountId && (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      You need to connect your Stripe account to receive payments from pupils. 
                      This is a secure process managed by Stripe.
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

                {errorMessage && (
                  <Alert className="border-rose-200 bg-rose-50">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <AlertDescription className="text-rose-800">
                      {errorMessage}
                      {errorMessage.includes('Invalid API Key') && (
                        <span className="block mt-2 text-sm">
                          Please check that your Stripe secret key is correctly configured in the dashboard settings. 
                          It should start with "sk_test_" or "sk_live_".
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

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
            )}
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