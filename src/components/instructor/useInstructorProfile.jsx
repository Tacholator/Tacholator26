import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to get or create instructor profile for admin users
 * Ensures all admin users have an instructor profile
 */
export function useInstructorProfile(user) {
  return useQuery({
    queryKey: ['instructorProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Check if instructor profile exists
      const instructors = await base44.entities.Instructor.filter({ 
        created_by: user.email 
      });
      
      if (instructors.length > 0) {
        return instructors[0];
      }
      
      // Create instructor profile for admin if it doesn't exist
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
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}