import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useInstructorSubscription(userId) {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['instructorSubscription', userId],
    queryFn: async () => {
      const subs = await base44.entities.UserSubscription.filter({ userId });
      return subs[0] || null;
    },
    enabled: !!userId
  });
  const hasValidSub = !!(subscription && ['trialing', 'active'].includes(subscription.status));
  return { hasValidSub, isLoading, subscription };
}