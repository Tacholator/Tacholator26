import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useInstructorSubscription(userId, userEmail) {
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['instructorSubscription', userId],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ userId });
      return subs[0] || null;
    },
    enabled: !!userId
  });

  const { data: instructorProfile, isLoading: instructorLoading } = useQuery({
    queryKey: ['instructorProfileForSub', userEmail],
    queryFn: async () => {
      const results = await base44.entities.Instructor.filter({ created_by: userEmail });
      return results[0] || null;
    },
    enabled: !!userEmail
  });

  const hasOverride = !!instructorProfile?.platformAccessOverride;
  const hasValidSub = hasOverride || !!(subscription && ['trialing', 'active'].includes(subscription.status));
  const isLoading = subLoading || instructorLoading;

  return { hasValidSub, isLoading, subscription, hasOverride };
}