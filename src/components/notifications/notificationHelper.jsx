import { base44 } from '@/api/base44Client';

/**
 * Creates a notification only if the user's preferences allow it
 * @param {Object} notificationData - The notification data (userId, title, message, type, etc.)
 * @param {boolean} isRecipientInstructor - Whether the recipient is an instructor
 * @returns {Promise<Object|null>} The created notification or null if blocked by preferences
 */
export async function createNotificationIfAllowed(notificationData, isRecipientInstructor) {
  const { userId, type } = notificationData;

  try {
    // Fetch user preferences
    const entityName = isRecipientInstructor 
      ? 'InstructorNotificationPreferences' 
      : 'LearnerNotificationPreferences';
    const userIdField = isRecipientInstructor ? 'instructorId' : 'learnerId';
    
    const preferences = await base44.entities[entityName].filter({ [userIdField]: userId });
    const userPrefs = preferences[0];

    // If no preferences exist, allow all notifications (default behavior)
    if (!userPrefs) {
      return base44.entities.Notification.create(notificationData);
    }

    // Check if this notification type is allowed
    const isAllowed = checkNotificationAllowed(type, userPrefs, isRecipientInstructor);
    
    if (isAllowed) {
      return base44.entities.Notification.create(notificationData);
    }

    return null; // Notification blocked by user preferences
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // On error, create notification anyway (fail open)
    return base44.entities.Notification.create(notificationData);
  }
}

/**
 * Checks if a notification type is allowed based on user preferences
 */
function checkNotificationAllowed(notificationType, preferences, isInstructor) {
  if (isInstructor) {
    const typeMap = {
      'booking': 'notifBookingEvents',
      'message': 'notifPupilMessages',
      'lesson_arrival': 'notifArrivalResponses',
      'homework': 'notifHomeworkEvents',
      'skill': 'notifStudyEngagement',
      'progress': 'notifProgressUpdates',
      'payment': 'notifPaymentEvents',
      'system': 'notifSystemUpdates'
    };
    const prefKey = typeMap[notificationType];
    return prefKey ? (preferences[prefKey] ?? true) : true;
  } else {
    const typeMap = {
      'booking': 'notifBookingChanges',
      'message': 'notifInstructorMessages',
      'lesson_arrival': 'notifArrivalAlerts',
      'homework': 'notifHomeworkAssigned',
      'skill': 'notifStudyMaterialAssigned',
      'progress': 'notifLearningReminders',
      'payment': 'notifPaymentUpdates',
      'system': 'notifSystemInfo'
    };
    const prefKey = typeMap[notificationType];
    return prefKey ? (preferences[prefKey] ?? true) : true;
  }
}