import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useInstructorAccessCheck(pupil) {
  // Fetch instructor subscription by instructor email
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['instructorSubscription', pupil?.instructorEmail],
    queryFn: async () => {
      if (!pupil?.instructorEmail) return null;
      const subs = await base44.entities.UserSubscription.filter({ userId: pupil.instructorEmail });
      return subs[0] || null;
    },
    enabled: !!pupil?.instructorEmail
  });

  // Fetch instructor profile for platform access override
  const { data: instructorProfile, isLoading: instructorProfileLoading } = useQuery({
    queryKey: ['instructorProfileForAccess', pupil?.instructorEmail],
    queryFn: async () => {
      if (!pupil?.instructorEmail) return null;
      const results = await base44.entities.Instructor.filter({ created_by: pupil.instructorEmail });
      return results[0] || null;
    },
    enabled: !!pupil?.instructorEmail
  });

  // Check if instructor has valid access
  const hasValidAccess = !!(instructorProfile?.platformAccessOverride || (subscription?.status && ['trialing', 'active'].includes(subscription.status)));

  // Determine if loading
  const isLoading = subscriptionLoading || instructorProfileLoading;

  return {
    hasValidAccess,
    isLoading,
    subscription,
    instructorProfile
  };
}