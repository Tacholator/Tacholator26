import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RoleSelection from './pages/RoleSelection';
import AdminGpsRouteAccess from './pages/AdminGpsRouteAccess';
import AdminGpsRoutes from './pages/AdminGpsRoutes';
import InstructorGpsRoutes from './pages/InstructorGpsRoutes';
import LearnerClassNotes from './pages/LearnerClassNotes';
import ContactSupport from './pages/ContactSupport';
import AdminSupportMessages from './pages/AdminSupportMessages';
import AppFeedback from './pages/AppFeedback';
import AdminFeedback from './pages/AdminFeedback';
import AdminDeletionRequests from './pages/AdminDeletionRequests';
import InstructorSubscription from './pages/InstructorSubscription';
import AdminTestRoutes from './pages/AdminTestRoutes';
import AdminTestRouteCityDetail from './pages/AdminTestRouteCityDetail';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/InstructorGpsRoutes" element={
        <LayoutWrapper currentPageName="InstructorGpsRoutes">
          <InstructorGpsRoutes />
        </LayoutWrapper>
      } />
      <Route path="/AdminGpsRoutes" element={
        <LayoutWrapper currentPageName="AdminGpsRoutes">
          <AdminGpsRoutes />
        </LayoutWrapper>
      } />
      <Route path="/AdminGpsRouteAccess" element={
        <LayoutWrapper currentPageName="AdminGpsRouteAccess">
          <AdminGpsRouteAccess />
        </LayoutWrapper>
      } />
      <Route path="/LearnerClassNotes" element={
        <LayoutWrapper currentPageName="LearnerClassNotes">
          <LearnerClassNotes />
        </LayoutWrapper>
      } />
      <Route path="/ContactSupport" element={
        <LayoutWrapper currentPageName="ContactSupport">
          <ContactSupport />
        </LayoutWrapper>
      } />
      <Route path="/AdminSupportMessages" element={
        <LayoutWrapper currentPageName="AdminSupportMessages">
          <AdminSupportMessages />
        </LayoutWrapper>
      } />
      <Route path="/AppFeedback" element={
        <LayoutWrapper currentPageName="AppFeedback">
          <AppFeedback />
        </LayoutWrapper>
      } />
      <Route path="/AdminFeedback" element={
        <LayoutWrapper currentPageName="AdminFeedback">
          <AdminFeedback />
        </LayoutWrapper>
      } />
      <Route path="/AdminDeletionRequests" element={
        <LayoutWrapper currentPageName="AdminDeletionRequests">
          <AdminDeletionRequests />
        </LayoutWrapper>
      } />
      <Route path="/RoleSelection" element={
        <LayoutWrapper currentPageName="RoleSelection">
          <RoleSelection />
        </LayoutWrapper>
      } />
      <Route path="/InstructorSubscription" element={
        <LayoutWrapper currentPageName="InstructorSubscription">
          <InstructorSubscription />
        </LayoutWrapper>
      } />
      <Route path="/AdminTestRoutes" element={
        <LayoutWrapper currentPageName="AdminTestRoutes">
          <AdminTestRoutes />
        </LayoutWrapper>
      } />
      <Route path="/AdminTestRouteCityDetail" element={
        <LayoutWrapper currentPageName="AdminTestRouteCityDetail">
          <AdminTestRouteCityDetail />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App