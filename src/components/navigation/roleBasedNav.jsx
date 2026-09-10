import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  MessageCircle,
  Calendar,
  CalendarDays,
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
  Star,
  BarChart2,
  HeadphonesIcon,
  MessageSquarePlus,
  UserX,
  ClipboardCheck,
  Navigation,
  Gift,
  Fuel,
  CheckSquare,
  Brain,
  Scroll,
  Video
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
      { name: 'Payment Management', icon: CreditCard, page: 'InstructorPayments' },
      { name: 'Manage Subscription', icon: Star, page: 'InstructorSubscription' },
      { name: 'Test Route Subscriptions', icon: Star, page: 'TestRouteSubscriptions' }
    ],
    learnerChildren: [
      { name: 'Payment Management', icon: CreditCard, page: 'LearnerPayments' },
      { name: 'Test Route Subscriptions', icon: Star, page: 'TestRouteSubscriptions' }
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    instructorPage: 'InstructorNotifications',
    learnerPage: 'LearnerNotifications'
  },
];

// Instructor-only navigation items
export const instructorOnlyLinks = [
  { name: 'Schedule', icon: CalendarDays, page: 'InstructorSchedule' },
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
      { name: 'MCQ Reports', icon: ClipboardList, page: 'InstructorMcqReporting' },
      { name: 'Resources', icon: BookOpen, page: 'InstructorResources' },
      { name: 'Teaching Notes', icon: StickyNote, page: 'InstructorTeachingNotes' },
      { name: 'Manage Nerves', icon: Brain, page: 'ManageNerves' },
      { name: 'Ten Commandments', icon: Scroll, page: 'TenCommandments' },
      { name: 'Commandments Checklist', icon: CheckSquare, page: 'TenCommandmentsChecklist' },
      { name: 'Homework', icon: ClipboardList, page: 'HomeworkLibrary' }
    ]
  },
  { name: 'Test Routes', icon: Navigation, page: 'TestRoutes', isPremium: true },
  { name: 'Readiness Reviews', icon: CheckSquare, page: 'InstructorReadinessReview' },
  { name: 'GPS Routes', icon: MapPin, page: 'InstructorGpsRoutes', requiresGpsAccess: true },
  { name: 'Expenses', icon: Fuel, page: 'InstructorExpenses' },
  { name: 'Reports', icon: BarChart2, page: 'InstructorReports' },
  { name: 'Referral Program', icon: Gift, page: 'InstructorReferralProgram' }
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
      { name: 'Homework', icon: ClipboardList, page: 'LearnerHomework' },
      { name: 'Learning Notes', icon: StickyNote, page: 'LearnerLearningNotes' },
      { name: 'Class Notes', icon: Notebook, page: 'LearnerClassNotes' },
      { name: 'Mock Tests', icon: ClipboardList, page: 'LearnerMockTests' },
      { name: 'Manage Nerves', icon: Brain, page: 'ManageNerves' },
      { name: 'Ten Commandments', icon: Scroll, page: 'TenCommandments' },
      { name: 'Lesson Diary', icon: BookOpen, page: 'LearnerDiary' }
    ]
  },
  { name: 'Test Routes', icon: Navigation, page: 'TestRoutes', isPremium: true },
  { name: 'Test Readiness Checker', icon: CheckSquare, page: 'TestReadinessChecker' },
  { name: 'Book a Lesson', icon: Calendar, page: 'LearnerBookingCalendar' },
  { name: 'My Bookings', icon: BookMarked, page: 'LearnerMyBookings' },
  { name: 'My Instructor', icon: UserCircle, page: 'LearnerMyInstructor' },
  { name: 'Refer a Friend', icon: Gift, page: 'ReferAFriend' }
];

// Get the correct page for a shared link based on user role
export const getPageForRole = (linkId, isInstructor) => {
  const link = sharedNavLinks.find(l => l.id === linkId);
  if (!link) return null;
  return isInstructor ? link.instructorPage : link.learnerPage;
};

// Build complete navigation array for a role
export const buildNavigation = (isInstructor, isMainAdmin = false, pupilStatus = 'Active', testRoutesAccessEnabled = false, gpsRoutesAccessEnabled = false, practicalTestPassDate = null, hasPublishedTestRoutes = true) => {
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

  let roleSpecific = isInstructor ? instructorOnlyLinks.filter(link => (!link.requiresGpsAccess || gpsRoutesAccessEnabled) && !(isMainAdmin && link.page === 'InstructorGpsRoutes')) : [
    ...learnerOnlyLinks,
  ];

  // Learners: inject the "Test Route Videos" link (gated by instructor access flag) above "My Instructor"
  if (!isInstructor && testRoutesAccessEnabled) {
    const myInstructorIdx = roleSpecific.findIndex(l => l.page === 'LearnerMyInstructor');
    const testRouteVideosLink = { name: 'Test Route Videos', icon: Video, page: 'LearnerFreeTestRoutes', isFreeBadge: true };
    if (myInstructorIdx >= 0) {
      roleSpecific.splice(myInstructorIdx, 0, testRouteVideosLink);
    } else {
      roleSpecific.push(testRouteVideosLink);
    }
  }
  
  // Filter out admin-only links for non-admin instructors
  if (isInstructor && !isMainAdmin) {
    roleSpecific = roleSpecific.filter(link => !link.adminOnly);
  }

  // Hide the Test Routes tab entirely when no published test centres exist
  if (!hasPublishedTestRoutes) {
    roleSpecific = roleSpecific.filter(link => link.page !== 'TestRoutes');
  }



  // Check if a Passed pupil is more than 7 days past their pass date
  const isPassedAndExpired = !isInstructor && pupilStatus === 'Passed' && practicalTestPassDate
    ? (() => {
        const passDate = new Date(practicalTestPassDate);
        const daysSincePass = (Date.now() - passDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSincePass > 7;
      })()
    : false;

  // For non-active pupils (OnHold/Stopped), only show: Home, Book a Lesson, Payments, Notifications
  // Passed pupils retain full access for 7 days, then get restricted to the same limited nav
  if (!isInstructor && (pupilStatus !== 'Active' && pupilStatus !== 'Passed' || isPassedAndExpired)) {
    const allowedIds = ['home', 'payments', 'notifications'];
    const allowedShared = shared.filter(link => 
      allowedIds.includes(sharedNavLinks.find(s => 
        (isInstructor ? s.instructorPage : s.learnerPage) === link.page
      )?.id)
    );
    const bookLessonLink = learnerOnlyLinks.find(l => l.page === 'LearnerBookingCalendar');
    const myBookingsLink = learnerOnlyLinks.find(l => l.page === 'LearnerMyBookings');
    
    return [
      shared[0], // Home
      bookLessonLink, // Book a Lesson
      myBookingsLink, // My Bookings
      ...allowedShared.filter(s => s.page !== (isInstructor ? 'Home' : 'Home')) // Payments, Notifications
    ];
  }

  // Combine: Home first, then role-specific items, then shared items (excluding Home), then admin items at the end
  const adminDashboard = isInstructor && isMainAdmin 
    ? [
        { name: 'Admin Dashboard', icon: Settings, page: 'AdminDashboard' },
        { name: 'GPS Routes', icon: MapPin, page: 'AdminGpsRoutes' },
        { name: 'GPS Route Access', icon: MapPin, page: 'AdminGpsRouteAccess' },
        { name: 'Support Messages', icon: HeadphonesIcon, page: 'AdminSupportMessages' },
        { name: 'App Feedback', icon: MessageSquarePlus, page: 'AdminFeedback' },
        { name: 'Deleted Accounts', icon: UserX, page: 'AdminDeletedAccounts' }
      ] 
    : [];
  
  const contactSupport = { name: 'Contact Support', icon: HeadphonesIcon, page: 'ContactSupport' };
  const appFeedback = { name: 'App Feedback', icon: MessageSquarePlus, page: 'AppFeedback' };

  return [
    shared[0], // Home
    ...roleSpecific,
    ...shared.slice(1), // Payments, Notifications (Homework excluded for instructors)
    ...adminDashboard, // Admin Dashboard at the end (after Chats)
    ...(isMainAdmin ? [] : [contactSupport, appFeedback]) // Contact Support & Feedback for non-main-admin users
  ];
};