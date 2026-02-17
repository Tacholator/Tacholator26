/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountDeletionRequest from './pages/AccountDeletionRequest';
import AdminDailyQuizzes from './pages/AdminDailyQuizzes';
import AdminDataManagement from './pages/AdminDataManagement';
import AdminInstructorCalendars from './pages/AdminInstructorCalendars';
import AdminRoleManagement from './pages/AdminRoleManagement';
import Calendar from './pages/Calendar';
import CourseWork from './pages/CourseWork';
import CourseWorkDetail from './pages/CourseWorkDetail';
import DVSASkillDetail from './pages/DVSASkillDetail';
import DVSASkills from './pages/DVSASkills';
import DrivingProgressV2 from './pages/DrivingProgressV2';
import FutureUpdates from './pages/FutureUpdates';
import Home from './pages/Home';
import HomeworkLibrary from './pages/HomeworkLibrary';
import InstructorBookingCalendar from './pages/InstructorBookingCalendar';
import InstructorChats from './pages/InstructorChats';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorGpsRouteSetup from './pages/InstructorGpsRouteSetup';
import InstructorMcqReporting from './pages/InstructorMcqReporting';
import InstructorMyTeaching from './pages/InstructorMyTeaching';
import InstructorNotifications from './pages/InstructorNotifications';
import InstructorPayments from './pages/InstructorPayments';
import InstructorPupilNotes from './pages/InstructorPupilNotes';
import InstructorPupilNotesList from './pages/InstructorPupilNotesList';
import InstructorQuizPreview from './pages/InstructorQuizPreview';
import InstructorResources from './pages/InstructorResources';
import InstructorStripeConnect from './pages/InstructorStripeConnect';
import InstructorTeachingHub from './pages/InstructorTeachingHub';
import InstructorTestRouteDetail from './pages/InstructorTestRouteDetail';
import InstructorTestRoutes from './pages/InstructorTestRoutes';
import InstructorTopicAssignment from './pages/InstructorTopicAssignment';
import InstructorWhiteboardEditor from './pages/InstructorWhiteboardEditor';
import InstructorWhiteboardLibrary from './pages/InstructorWhiteboardLibrary';
import Invoices from './pages/Invoices';
import LearnerBookingCalendar from './pages/LearnerBookingCalendar';
import LearnerCalendar from './pages/LearnerCalendar';
import LearnerChats from './pages/LearnerChats';
import LearnerDashboard from './pages/LearnerDashboard';
import LearnerGpsFollowAlong from './pages/LearnerGpsFollowAlong';
import LearnerHomework from './pages/LearnerHomework';
import LearnerLearningHub from './pages/LearnerLearningHub';
import LearnerLessons from './pages/LearnerLessons';
import LearnerMyInstructor from './pages/LearnerMyInstructor';
import LearnerMyLearning from './pages/LearnerMyLearning';
import LearnerNotes from './pages/LearnerNotes';
import LearnerNotifications from './pages/LearnerNotifications';
import LearnerPayments from './pages/LearnerPayments';
import LearnerProgress from './pages/LearnerProgress';
import LearnerResources from './pages/LearnerResources';
import LearnerScheduledLessons from './pages/LearnerScheduledLessons';
import LearnerSkillStudy from './pages/LearnerSkillStudy';
import LearnerSkills from './pages/LearnerSkills';
import LearnerTestRouteDetail from './pages/LearnerTestRouteDetail';
import LearnerTestRoutes from './pages/LearnerTestRoutes';
import LessonTermsAndConditions from './pages/LessonTermsAndConditions';
import LiveRouteViewer from './pages/LiveRouteViewer';
import PaymentMethods from './pages/PaymentMethods';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfileSettings from './pages/ProfileSettings';
import PupilList from './pages/PupilList';
import PupilProfile from './pages/PupilProfile';
import RefundPolicy from './pages/RefundPolicy';
import SkillBasedProgress from './pages/SkillBasedProgress';
import SkillDetail from './pages/SkillDetail';
import TermsAndConditions from './pages/TermsAndConditions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountDeletionRequest": AccountDeletionRequest,
    "AdminDailyQuizzes": AdminDailyQuizzes,
    "AdminDataManagement": AdminDataManagement,
    "AdminInstructorCalendars": AdminInstructorCalendars,
    "AdminRoleManagement": AdminRoleManagement,
    "Calendar": Calendar,
    "CourseWork": CourseWork,
    "CourseWorkDetail": CourseWorkDetail,
    "DVSASkillDetail": DVSASkillDetail,
    "DVSASkills": DVSASkills,
    "DrivingProgressV2": DrivingProgressV2,
    "FutureUpdates": FutureUpdates,
    "Home": Home,
    "HomeworkLibrary": HomeworkLibrary,
    "InstructorBookingCalendar": InstructorBookingCalendar,
    "InstructorChats": InstructorChats,
    "InstructorDashboard": InstructorDashboard,
    "InstructorGpsRouteSetup": InstructorGpsRouteSetup,
    "InstructorMcqReporting": InstructorMcqReporting,
    "InstructorMyTeaching": InstructorMyTeaching,
    "InstructorNotifications": InstructorNotifications,
    "InstructorPayments": InstructorPayments,
    "InstructorPupilNotes": InstructorPupilNotes,
    "InstructorPupilNotesList": InstructorPupilNotesList,
    "InstructorQuizPreview": InstructorQuizPreview,
    "InstructorResources": InstructorResources,
    "InstructorStripeConnect": InstructorStripeConnect,
    "InstructorTeachingHub": InstructorTeachingHub,
    "InstructorTestRouteDetail": InstructorTestRouteDetail,
    "InstructorTestRoutes": InstructorTestRoutes,
    "InstructorTopicAssignment": InstructorTopicAssignment,
    "InstructorWhiteboardEditor": InstructorWhiteboardEditor,
    "InstructorWhiteboardLibrary": InstructorWhiteboardLibrary,
    "Invoices": Invoices,
    "LearnerBookingCalendar": LearnerBookingCalendar,
    "LearnerCalendar": LearnerCalendar,
    "LearnerChats": LearnerChats,
    "LearnerDashboard": LearnerDashboard,
    "LearnerGpsFollowAlong": LearnerGpsFollowAlong,
    "LearnerHomework": LearnerHomework,
    "LearnerLearningHub": LearnerLearningHub,
    "LearnerLessons": LearnerLessons,
    "LearnerMyInstructor": LearnerMyInstructor,
    "LearnerMyLearning": LearnerMyLearning,
    "LearnerNotes": LearnerNotes,
    "LearnerNotifications": LearnerNotifications,
    "LearnerPayments": LearnerPayments,
    "LearnerProgress": LearnerProgress,
    "LearnerResources": LearnerResources,
    "LearnerScheduledLessons": LearnerScheduledLessons,
    "LearnerSkillStudy": LearnerSkillStudy,
    "LearnerSkills": LearnerSkills,
    "LearnerTestRouteDetail": LearnerTestRouteDetail,
    "LearnerTestRoutes": LearnerTestRoutes,
    "LessonTermsAndConditions": LessonTermsAndConditions,
    "LiveRouteViewer": LiveRouteViewer,
    "PaymentMethods": PaymentMethods,
    "PrivacyPolicy": PrivacyPolicy,
    "ProfileSettings": ProfileSettings,
    "PupilList": PupilList,
    "PupilProfile": PupilProfile,
    "RefundPolicy": RefundPolicy,
    "SkillBasedProgress": SkillBasedProgress,
    "SkillDetail": SkillDetail,
    "TermsAndConditions": TermsAndConditions,
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
    Layout: __Layout,
};