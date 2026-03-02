import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LogOut,
  Menu,
  X,
  Car,
  Trash2,
  Settings,
  FileText,
  Shield,
  Receipt,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buildNavigation } from '@/components/navigation/roleBasedNav';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import AccountProfilePanel from '@/components/account/AccountProfilePanel';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeCollapsibleMenu, setActiveCollapsibleMenu] = useState(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  // Check if user has a pupil record (determines if they're a learner)
  const { data: pupilProfile, isLoading: isPupilProfileLoading } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const allPupils = await base44.entities.Pupil.list();
      
      // First try to match by linkedUserId (most reliable)
      let matchingPupil = allPupils.find(p => p.linkedUserId === user.id);
      
      // Fallback to case-insensitive email match if no linkedUserId match
      if (!matchingPupil) {
        matchingPupil = allPupils.find(
          p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
        );
      }
      
      return matchingPupil || null;
    },
    enabled: !!user?.id && !!user?.email
  });

  // Determine if user is instructor or learner
  // If user has a pupil record, they're a learner regardless of role
  const isLearner = pupilProfile !== null && pupilProfile !== undefined;
  const isInstructor = !isLearner && user?.role === 'admin';
  const isMainAdmin = isInstructor && user?.email === 'fasobah@gmail.com';

  // Fetch unread messages count
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['unreadMessagesCount', user?.id, isInstructor],
    queryFn: async () => {
      if (!user?.id) return 0;
      const messages = await base44.entities.Message.filter({ readAt: null });
      const unreadForUser = messages.filter(msg => {
        if (isInstructor) {
          return msg.senderRole === 'pupil' && msg.instructorId === user.id;
        } else {
          return msg.senderRole === 'instructor' && msg.pupilId === pupilProfile?.id;
        }
      });
      return unreadForUser.length;
    },
    enabled: !!user?.id && (isInstructor || !!pupilProfile?.id),
    refetchInterval: 10000
  });

  // Fetch unread notifications count
  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['unreadNotificationsCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const notifications = await base44.entities.Notification.filter({ userId: user.id });
      return notifications.filter(n => !n.readAt).length;
    },
    enabled: !!user?.id,
    refetchInterval: 15000
  });
  
  // Build navigation dynamically based on role and pupil status
  const pupilStatus = pupilProfile?.status || 'Active';
  const baseNavItems = buildNavigation(isInstructor, isMainAdmin, pupilStatus);
  
  // baseNavItems already includes admin-only items filtered by isMainAdmin
  const navItems = baseNavItems;

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      base44.auth.logout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  };

  // Don't show layout for non-authenticated users
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Wait for pupil profile to load before rendering to prevent showing wrong dashboard
  if (isPupilProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
        <div className="flex grow flex-col gap-y-5 overflow-visible bg-[#071739] border-r border-[#071739] px-6 pb-4">
          {/* Logo */}
                      <div className="flex h-16 shrink-0 items-center gap-2">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png" 
                          alt="Mobrage" 
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <span className="font-bold text-xl text-white">Tacholator</span>
                      </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col relative">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const isExpanded = expandedMenus[item.name];
                const hasActiveChild = item.children?.some(child => currentPageName === child.page);
                
                return (
                  <li key={item.name}>
                    {item.isCollapsible ? (
                      <>
                        <button
                           onClick={() => {
                             if (expandedMenus[item.name]) {
                               setExpandedMenus({});
                             } else {
                               setExpandedMenus({ [item.name]: true });
                             }
                           }}
                           className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 w-full ${
                            isActive || hasActiveChild
                              ? 'bg-[#F7B602] text-[#071739]'
                              : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 shrink-0 ${
                            isActive || hasActiveChild ? 'text-[#071739]' : 'text-slate-300 group-hover:text-white'
                          }`} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded && item.children && (
                           <AnimatePresence>
                             <motion.div
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               exit={{ opacity: 0, x: -20 }}
                               className="fixed left-64 top-24 w-56 bg-[#071739]/95 backdrop-blur-sm border-r border-slate-700 h-[calc(100vh-6rem)] overflow-y-auto z-[200] rounded-xl"
                             >
                              <div className="p-4 space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                  {item.name}
                                </p>
                                {item.children.map((child) => {
                                  const isChildActive = currentPageName === child.page;
                                  return (
                                    <Link
                                      key={child.name}
                                      to={createPageUrl(child.page)}
                                      className={`group flex gap-x-3 rounded-xl p-3 text-sm transition-all duration-200 block ${
                                        isChildActive
                                          ? 'bg-[#F7B602] text-[#071739]'
                                          : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                                      }`}
                                    >
                                      <child.icon className={`w-4 h-4 shrink-0 ${
                                        isChildActive ? 'text-[#071739]' : 'text-slate-300 group-hover:text-white'
                                      }`} />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </>
                    ) : (
                      <Link
                        to={createPageUrl(item.page)}
                        onClick={() => setExpandedMenus({})}
                        className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 relative ${
                          isActive
                            ? 'bg-[#F7B602] text-[#071739]'
                            : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-[#071739]' : 'text-slate-300 group-hover:text-white'
                        }`} />
                        {item.name}
                        {item.name === 'Chats' && unreadMessagesCount > 0 && (
                          <Badge className="ml-auto bg-[#F7B602] text-[#071739] text-xs font-bold px-2 h-5">
                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                          </Badge>
                        )}
                        {item.name === 'Notifications' && unreadNotificationsCount > 0 && (
                          <Badge className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 h-5">
                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="border-t border-slate-700 pt-4">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-[#071739]/80 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.profilePhotoUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739]">
                      {user?.firstName?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-slate-300">
                      {isInstructor ? 'Instructor' : 'Learner'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-72 p-0"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <AccountProfilePanel 
                  user={user}
                  isInstructor={isInstructor}
                  onLogout={handleLogout}
                  onDelete={() => setShowDeleteDialog(true)}
                  onClose={() => {}}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-x-4 bg-[#071739] border-b border-[#071739] px-4 shadow-sm">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -m-2 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 flex-1">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png" 
                        alt="Mobrage" 
                        className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="font-bold text-lg text-white">Tacholator</span>
                                </div>
                      <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowAccountPanel(true)}
                        className="focus:outline-none"
                      >
                        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={user?.profilePhotoUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] text-sm">
                            {user?.firstName?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
          </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#071739] lg:hidden"
              >
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                                      <img 
                                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png" 
                                        alt="Mobrage" 
                                        className="w-8 h-8 rounded-lg object-cover"
                                        />
                                        <span className="font-bold text-lg text-white">Tacholator</span>
                                    </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -m-2 text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="px-4 py-2">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  const isExpanded = expandedMenus[item.name];
                  const hasActiveChild = item.children?.some(child => currentPageName === child.page);

                  return (
                    <div key={item.name} className="mb-1">
                      {item.isCollapsible ? (
                        <>
                          <button
                            onClick={() => {
                              if (expandedMenus[item.name]) {
                                setExpandedMenus(prev => ({ ...prev, [item.name]: false }));
                              } else {
                                setExpandedMenus({ [item.name]: true });
                              }
                            }}
                            className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all w-full ${
                              isActive || hasActiveChild
                                ? 'bg-[#F7B602] text-[#071739]'
                                : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                            }`}
                          >
                            <item.icon className={`w-5 h-5 ${isActive || hasActiveChild ? 'text-[#071739]' : 'text-slate-300'}`} />
                            <span className="flex-1 text-left">{item.name}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          {isExpanded && item.children && (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="mt-2 space-y-1 bg-[#071739]/50 rounded-lg p-3 border-l-2 border-[#F7B602]"
                            >
                              {item.children.map((child) => {
                                const isChildActive = currentPageName === child.page;
                                return (
                                  <Link
                                    key={child.name}
                                    to={createPageUrl(child.page)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg p-2 text-sm transition-all ${
                                      isChildActive
                                        ? 'bg-[#F7B602] text-[#071739]'
                                        : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                                    }`}
                                  >
                                    <child.icon className={`w-4 h-4 ${isChildActive ? 'text-[#071739]' : 'text-slate-300'}`} />
                                    {child.name}
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <Link
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-[#F7B602] text-[#071739]'
                              : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-[#071739]' : 'text-slate-300'}`} />
                          {item.name}
                          {item.name === 'Chats' && unreadMessagesCount > 0 && (
                            <Badge className="ml-auto bg-[#F7B602] text-[#071739] text-xs font-bold px-2 h-5">
                              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                            </Badge>
                          )}
                          {item.name === 'Notifications' && unreadNotificationsCount > 0 && (
                            <Badge className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 h-5">
                              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                            </Badge>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-rose-400 hover:bg-[#071739]/80 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        userId={user?.id} 
        currentPageName={currentPageName}
        isInstructor={isInstructor}
      />

      {/* Mobile Account Panel Full Screen */}
      <AnimatePresence>
        {showAccountPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 p-4 border-b border-slate-200">
                <button
                  onClick={() => setShowAccountPanel(false)}
                  className="p-2 -m-2 text-slate-600 hover:text-slate-900"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <h1 className="text-lg font-semibold text-[#071739]">Account</h1>
              </div>
              <div className="flex-1">
                <AccountProfilePanel 
                  user={user}
                  isInstructor={isInstructor}
                  onLogout={handleLogout}
                  onDelete={() => setShowDeleteDialog(true)}
                  onClose={() => setShowAccountPanel(false)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
      </div>
      );
      }