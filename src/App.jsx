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
import LearnerClassNotes from './pages/LearnerClassNotes';
import ContactSupport from './pages/ContactSupport';
import AdminSupportMessages from './pages/AdminSupportMessages';
import AppFeedback from './pages/AppFeedback';
import AdminFeedback from './pages/AdminFeedback';
import AdminDeletionRequests from './pages/AdminDeletionRequests';
import InstructorSubscription from './pages/InstructorSubscription';
import AdminTestRoutes from './pages/AdminTestRoutes';
import AdminTestRouteCityDetail from './pages/AdminTestRouteCityDetail';
import VideoSubscription from './pages/VideoSubscription';
import AdminNationalCentreDetail from './pages/AdminNationalCentreDetail';
import TestRoutes from './pages/TestRoutes';
import TestCentreDetail from './pages/TestCentreDetail';
import TestRouteSubscriptions from './pages/TestRouteSubscriptions';
import SubscriptionTerms from './pages/SubscriptionTerms';
import TestRouteTerms from './pages/TestRouteTerms';

import MockTestReportForm from './pages/MockTestReportForm';
import MockTestReportList from './pages/MockTestReportList';
import MockTestReportView from './pages/MockTestReportView';
import LearnerMockTests from './pages/LearnerMockTests';
import LearnerDiary from './pages/LearnerDiary';
import Community from './pages/Community';
import AdminEmailTemplates from './pages/AdminEmailTemplates';
import InstructorTeachingNotes from './pages/InstructorTeachingNotes';
import InstructorTeachingNoteDetail from './pages/InstructorTeachingNoteDetail';
import LearnerLearningNotes from './pages/LearnerLearningNotes';
import InstructorExpenses from './pages/InstructorExpenses';
import TestReadinessChecker from './pages/TestReadinessChecker';
import InstructorReadinessReview from './pages/InstructorReadinessReview';
import AdminMarketing from './pages/AdminMarketing';
import ManageNerves from './pages/ManageNerves';
import PupilTopicDetail from './pages/PupilTopicDetail';
import LearnerFreeTestRoutes from './pages/LearnerFreeTestRoutes';
import TopTenReasons from './pages/TopTenReasons';
import AdminVideoResources from './pages/AdminVideoResources';
import AdminDeletedAccounts from './pages/AdminDeletedAccounts';
import PendingBookingRequests from './pages/PendingBookingRequests';

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
      <Route path="/VideoSubscription" element={
        <LayoutWrapper currentPageName="VideoSubscription">
          <VideoSubscription />
        </LayoutWrapper>
      } />
      <Route path="/AdminNationalCentreDetail" element={
        <LayoutWrapper currentPageName="AdminNationalCentreDetail">
          <AdminNationalCentreDetail />
        </LayoutWrapper>
      } />
      <Route path="/TestRoutes" element={
        <LayoutWrapper currentPageName="TestRoutes">
          <TestRoutes />
        </LayoutWrapper>
      } />
      <Route path="/TestCentreDetail" element={
        <LayoutWrapper currentPageName="TestCentreDetail">
          <TestCentreDetail />
        </LayoutWrapper>
      } />
      <Route path="/testroutesubscriptions" element={
        <LayoutWrapper currentPageName="TestRouteSubscriptions">
          <TestRouteSubscriptions />
        </LayoutWrapper>
      } />
      <Route path="/SubscriptionTerms" element={
        <LayoutWrapper currentPageName="SubscriptionTerms">
          <SubscriptionTerms />
        </LayoutWrapper>
      } />
      <Route path="/TestRouteTerms" element={
        <LayoutWrapper currentPageName="TestRouteTerms">
          <TestRouteTerms />
        </LayoutWrapper>
      } />
      <Route path="/MockTestReportForm" element={
        <LayoutWrapper currentPageName="MockTestReportForm">
          <MockTestReportForm />
        </LayoutWrapper>
      } />
      <Route path="/MockTestReportList" element={
        <LayoutWrapper currentPageName="MockTestReportList">
          <MockTestReportList />
        </LayoutWrapper>
      } />
      <Route path="/MockTestReportView" element={
        <LayoutWrapper currentPageName="MockTestReportView">
          <MockTestReportView />
        </LayoutWrapper>
      } />
      <Route path="/LearnerMockTests" element={
        <LayoutWrapper currentPageName="LearnerMockTests">
          <LearnerMockTests />
        </LayoutWrapper>
      } />
      <Route path="/LearnerDiary" element={
        <LayoutWrapper currentPageName="LearnerDiary">
          <LearnerDiary />
        </LayoutWrapper>
      } />
      <Route path="/Community" element={
        <LayoutWrapper currentPageName="Community">
          <Community />
        </LayoutWrapper>
      } />
      <Route path="/AdminEmailTemplates" element={
        <LayoutWrapper currentPageName="AdminEmailTemplates">
          <AdminEmailTemplates />
        </LayoutWrapper>
      } />
      <Route path="/InstructorTeachingNotes" element={
        <LayoutWrapper currentPageName="InstructorTeachingNotes">
          <InstructorTeachingNotes />
        </LayoutWrapper>
      } />
      <Route path="/InstructorTeachingNoteDetail" element={
        <LayoutWrapper currentPageName="InstructorTeachingNotes">
          <InstructorTeachingNoteDetail />
        </LayoutWrapper>
      } />
      <Route path="/LearnerLearningNotes" element={
        <LayoutWrapper currentPageName="LearnerLearningNotes">
          <LearnerLearningNotes />
        </LayoutWrapper>
      } />
      <Route path="/InstructorExpenses" element={
        <LayoutWrapper currentPageName="InstructorExpenses">
          <InstructorExpenses />
        </LayoutWrapper>
      } />
      <Route path="/TestReadinessChecker" element={
        <LayoutWrapper currentPageName="TestReadinessChecker">
          <TestReadinessChecker />
        </LayoutWrapper>
      } />
      <Route path="/InstructorReadinessReview" element={
        <LayoutWrapper currentPageName="InstructorReadinessReview">
          <InstructorReadinessReview />
        </LayoutWrapper>
      } />
      <Route path="/AdminMarketing" element={
        <LayoutWrapper currentPageName="AdminMarketing">
          <AdminMarketing />
        </LayoutWrapper>
      } />
      <Route path="/ManageNerves" element={
        <LayoutWrapper currentPageName="ManageNerves">
          <ManageNerves />
        </LayoutWrapper>
      } />
      <Route path="/PupilTopicDetail" element={
        <LayoutWrapper currentPageName="PupilTopicDetail">
          <PupilTopicDetail />
        </LayoutWrapper>
      } />
      <Route path="/LearnerFreeTestRoutes" element={
        <LayoutWrapper currentPageName="LearnerFreeTestRoutes">
          <LearnerFreeTestRoutes />
        </LayoutWrapper>
      } />
      <Route path="/TopTenReasons" element={
        <LayoutWrapper currentPageName="TopTenReasons">
          <TopTenReasons />
        </LayoutWrapper>
      } />
      <Route path="/AdminVideoResources" element={
        <LayoutWrapper currentPageName="AdminVideoResources">
          <AdminVideoResources />
        </LayoutWrapper>
      } />
      <Route path="/AdminDeletedAccounts" element={
        <LayoutWrapper currentPageName="AdminDeletedAccounts">
          <AdminDeletedAccounts />
        </LayoutWrapper>
      } />
      <Route path="/PendingBookingRequests" element={
        <LayoutWrapper currentPageName="PendingBookingRequests">
          <PendingBookingRequests />
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