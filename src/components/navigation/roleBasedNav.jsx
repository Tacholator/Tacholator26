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
  CreditCard,
  Wallet,
  MapPin,
  UserCircle,
  Pen,
  Sparkles,
  Settings,
  Receipt,
  BookMarked,
  Star
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
    instructorPage: null, // Homework for instructors is now in My Teaching submenu
    learnerPage: null // Homework for learners is now in My Learning submenu
  },
  {
    id: 'payments',
    name: 'Payments & Plans',
    icon: CreditCard,
    instructorPage: 'InstructorPayments',
    learnerPage: 'LearnerPayments',
    isCollapsible: true,
    instructorChildren: [
      { name: 'Payment Management', icon: CreditCard, page: 'InstructorPayments' }
    ],
    learnerChildren: [
      { name: 'Payment Management', icon: CreditCard, page: 'LearnerPayments' }
    ]
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
  { 
    name: 'My Teaching', 
    icon: GraduationCap, 
    page: 'InstructorMyTeaching',
    isCollapsible: true,
    children: [
      { name: 'Whiteboards', icon: Pen, page: 'InstructorWhiteboardLibrary' },
      { name: 'Course Work', icon: FileText, page: 'CourseWork' },
      { name: 'Pupil Notes', icon: Notebook, page: 'InstructorPupilNotes' },
      { name: 'Topic Access', icon: Lock, page: 'InstructorTopicAssignment' },
      { name: 'MCQ Reports', icon: ClipboardList, page: 'InstructorMcqReporting' },
      { name: 'Resources', icon: BookOpen, page: 'InstructorResources' },
      { name: 'Homework', icon: ClipboardList, page: 'HomeworkLibrary' }
    ]
  },
  { name: 'Test Routes', icon: MapPin, page: 'InstructorTestRoutes' }
];

// Learner-only navigation items
export const learnerOnlyLinks = [
  { 
    name: 'My Learning', 
    icon: BookOpen, 
    page: 'LearnerMyLearning',
    isCollapsible: true,
    children: [
      { name: 'Course Work', icon: FileText, page: 'CourseWork' },
      { name: 'My Notes', icon: StickyNote, page: 'LearnerNotes' },
      { name: 'Driving Progress', icon: GraduationCap, page: 'LearnerProgress' },
      { name: 'Resources', icon: FolderOpen, page: 'LearnerResources' },
      { name: 'Homework', icon: ClipboardList, page: 'LearnerHomework' }
    ]
  },
  { name: 'Book a Lesson', icon: Calendar, page: 'LearnerCalendar' },
  { name: 'My Bookings', icon: BookMarked, page: 'LearnerMyBookings' },
  { name: 'My Instructor', icon: UserCircle, page: 'LearnerMyInstructor' }
];

// Get the correct page for a shared link based on user role
export const getPageForRole = (linkId, isInstructor) => {
  const link = sharedNavLinks.find(l => l.id === linkId);
  if (!link) return null;
  return isInstructor ? link.instructorPage : link.learnerPage;
};

// Build complete navigation array for a role
export const buildNavigation = (isInstructor, isMainAdmin = false, pupilStatus = 'Active') => {
  const shared = sharedNavLinks
    .map(link => ({
      name: link.name,
      icon: link.icon,
      page: isInstructor ? link.instructorPage : link.learnerPage,
      isCollapsible: link.isCollapsible || false,
      children: isInstructor ? link.instructorChildren : link.learnerChildren,
      isShared: true
    }))
    .filter(link => link.page !== null); // Filter out items with null pages

  let roleSpecific = isInstructor ? instructorOnlyLinks : learnerOnlyLinks;
  
  // Filter out admin-only links for non-admin instructors
  if (isInstructor && !isMainAdmin) {
    roleSpecific = roleSpecific.filter(link => !link.adminOnly);
  }

  // For non-active pupils, only show: Home, Book a Lesson, Payments, Notifications, Chats
  if (!isInstructor && pupilStatus !== 'Active') {
    const allowedIds = ['home', 'payments', 'notifications', 'chats'];
    const allowedShared = shared.filter(link => 
      allowedIds.includes(sharedNavLinks.find(s => 
        (isInstructor ? s.instructorPage : s.learnerPage) === link.page
      )?.id)
    );
    const bookLessonLink = learnerOnlyLinks.find(l => l.page === 'LearnerCalendar');
    const myBookingsLink = learnerOnlyLinks.find(l => l.page === 'LearnerMyBookings');
    
    return [
      shared[0], // Home
      bookLessonLink, // Book a Lesson
      myBookingsLink, // My Bookings
      ...allowedShared.filter(s => s.page !== (isInstructor ? 'Home' : 'Home')) // Payments, Notifications, Chats
    ];
  }

  // Combine: Home first, then role-specific items, then shared items (excluding Home), then admin items at the end
  const adminDashboard = isInstructor && isMainAdmin 
    ? [
        { name: 'Admin Dashboard', icon: Settings, page: 'AdminDashboard' }
      ] 
    : [];
  
  return [
    shared[0], // Home
    ...roleSpecific,
    ...shared.slice(1), // Payments, Notifications, Chats (Homework excluded for instructors)
    ...adminDashboard // Admin Dashboard at the end (after Chats)
  ];
};