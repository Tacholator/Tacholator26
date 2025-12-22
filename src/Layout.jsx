import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Shield
} from 'lucide-react';
import { buildNavigation } from '@/components/navigation/roleBasedNav';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  // Redirect learners to LearnerDashboard on first sign-in
  useEffect(() => {
    if (user && isAuthenticated) {
      const isLearner = user.role === 'user';
      const isOnInstructorPage = currentPageName === 'InstructorDashboard' || 
                                  currentPageName === 'Calendar' || 
                                  currentPageName === 'PupilList' ||
                                  currentPageName === 'PupilProfile' ||
                                  currentPageName === 'InstructorResources' ||
                                  currentPageName === 'AdminDataManagement';
      
      if (isLearner && isOnInstructorPage) {
        navigate(createPageUrl('LearnerDashboard'), { replace: true });
      }
    }
  }, [user, isAuthenticated, currentPageName, navigate]);

  // Determine if user is instructor or learner
  const isInstructor = user?.role === 'admin';
  const isMainAdmin = user?.email === 'fasobah@gmail.com';
  
  // Build navigation dynamically based on role
  const baseNavItems = buildNavigation(isInstructor);
  
  // Add Data Management only for main admin
  const navItems = isInstructor && isMainAdmin
    ? [...baseNavItems, { name: 'Data Management', icon: Trash2, page: 'AdminDataManagement' }]
    : baseNavItems;

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#071739] border-r border-[#071739] px-6 pb-4">
          {/* Logo */}
                      <div className="flex h-16 shrink-0 items-center gap-2">
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png" 
                          alt="Mobrage" 
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <span className="font-bold text-xl text-white">Mobrage Tacholator</span>
                      </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <li key={item.name}>
                    <Link
                      to={createPageUrl(item.page)}
                      className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#F7B602] text-[#071739]'
                          : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-[#071739]' : 'text-slate-300 group-hover:text-white'
                      }`} />
                      {item.name}
                    </Link>
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
                className="w-56"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                  <Link to={createPageUrl('ProfileSettings')}>
                    <DropdownMenuItem className="text-slate-600 cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('TermsAndConditions')}>
                    <DropdownMenuItem className="text-slate-600 cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      Terms & Conditions
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl('PrivacyPolicy')}>
                    <DropdownMenuItem className="text-slate-600 cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Privacy Policy
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-slate-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-rose-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
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
                      <span className="font-bold text-lg text-white">Mobrage Tacholator</span>
                              </div>
                    <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] text-sm">
            {user?.firstName?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
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
                                        <span className="font-bold text-lg text-white">Mobrage Tacholator</span>
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
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl p-3 mb-1 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#F7B602] text-[#071739]'
                          : 'text-slate-300 hover:bg-[#071739]/80 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#071739]' : 'text-slate-300'}`} />
                      {item.name}
                    </Link>
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
    </div>
  );
}