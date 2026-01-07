import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  MessageCircle,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  FolderOpen,
  FileText,
  Lock,
  StickyNote,
  Notebook
} from 'lucide-react';

// Shared navigation links that route based on user role
export const sharedNavLinks = [
  {
    id: 'home',
    name: 'Home',
    icon: LayoutDashboard,
    instructorPage: 'Home',
    learnerPage: 'Home'
  },
  {
    id: 'homework',
    name: 'Homework',
    icon: ClipboardList,
    instructorPage: 'HomeworkLibrary',
    learnerPage: 'LearnerHomework'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    instructorPage: 'InstructorNotifications',
    learnerPage: 'LearnerNotifications'
  },
  {
    id: 'chats',
    name: 'Chats',
    icon: MessageCircle,
    instructorPage: 'InstructorChats',
    learnerPage: 'LearnerChats'
  }
];

// Instructor-only navigation items
export const instructorOnlyLinks = [
  { name: 'Calendar', icon: Calendar, page: 'Calendar' },
  { name: 'Pupils', icon: Users, page: 'PupilList' },
  { name: 'Course Work', icon: FileText, page: 'CourseWork' },
  { name: 'Pupil Notes', icon: Notebook, page: 'InstructorPupilNotes' },
  { name: 'Topic Access', icon: Lock, page: 'InstructorTopicAssignment' },
  { name: 'MCQ Reports', icon: ClipboardList, page: 'InstructorMcqReporting' },
  { name: 'Resources', icon: BookOpen, page: 'InstructorResources' }
];

// Learner-only navigation items
export const learnerOnlyLinks = [
  { name: 'Course Work', icon: FileText, page: 'CourseWork' },
  { name: 'My Notes', icon: StickyNote, page: 'LearnerNotes' },
  { name: 'Driving Progress', icon: GraduationCap, page: 'LearnerProgress' },
  { name: 'Book a Lesson', icon: Calendar, page: 'LearnerCalendar' },
  { name: 'Resources', icon: FolderOpen, page: 'LearnerResources' }
];

// Get the correct page for a shared link based on user role
export const getPageForRole = (linkId, isInstructor) => {
  const link = sharedNavLinks.find(l => l.id === linkId);
  if (!link) return null;
  return isInstructor ? link.instructorPage : link.learnerPage;
};

// Build complete navigation array for a role
export const buildNavigation = (isInstructor, isMainAdmin = false) => {
  try {
    if (!sharedNavLinks || !Array.isArray(sharedNavLinks)) {
      return [];
    }

    const shared = sharedNavLinks.map(link => ({
      name: link.name,
      icon: link.icon,
      page: isInstructor ? link.instructorPage : link.learnerPage,
      isShared: true
    }));

    // Ensure roleSpecific is always an array
    let roleSpecific = [];
    if (isInstructor) {
      roleSpecific = Array.isArray(instructorOnlyLinks) ? instructorOnlyLinks : [];
    } else {
      roleSpecific = Array.isArray(learnerOnlyLinks) ? learnerOnlyLinks : [];
    }

    // Combine: Home first, then role-specific items, then shared items (excluding Home)
    const result = [];
    
    if (shared.length > 0) {
      result.push(shared[0]); // Home
    }
    
    // Safely add role-specific items
    for (const item of roleSpecific) {
      if (item && item.name && item.icon && item.page) {
        result.push(item);
      }
    }
    
    // Safely add remaining shared items
    if (shared.length > 1) {
      const remaining = shared.slice(1);
      for (const item of remaining) {
        if (item && item.name && item.icon && item.page) {
          result.push(item);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error building navigation:', error);
    return [];
  }
};