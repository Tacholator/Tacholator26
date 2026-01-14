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
  Notebook,
  TrendingUp,
  Wallet
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
  },
  {
    id: 'payments',
    name: 'Payment Management',
    icon: Wallet,
    instructorPage: 'InstructorPayments',
    learnerPage: 'LearnerPayments'
  }
];

// Instructor-only navigation items
export const instructorOnlyLinks = [
  { name: 'Calendar', icon: Calendar, page: 'Calendar' },
  { name: 'Bookings', icon: ClipboardList, page: 'InstructorBookings' },
  { name: 'Pupils', icon: Users, page: 'PupilList' },
  { name: 'Analytics', icon: TrendingUp, page: 'InstructorAnalytics' },
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
  const shared = sharedNavLinks.map(link => ({
    name: link.name,
    icon: link.icon,
    page: isInstructor ? link.instructorPage : link.learnerPage,
    isShared: true
  }));

  const roleSpecific = isInstructor ? instructorOnlyLinks : learnerOnlyLinks;

  // Combine: Home first, then role-specific items, then shared items (excluding Home)
  return [
    shared[0], // Home
    ...roleSpecific,
    ...shared.slice(1) // Homework, Notifications, Chats
  ];
};