import AccountDeletionRequest from './pages/AccountDeletionRequest';
import AdminDataManagement from './pages/AdminDataManagement';
import AdminInstructorCalendars from './pages/AdminInstructorCalendars';
import Calendar from './pages/Calendar';
import CourseWork from './pages/CourseWork';
import CourseWorkDetail from './pages/CourseWorkDetail';
import DVSASkillDetail from './pages/DVSASkillDetail';
import DVSASkills from './pages/DVSASkills';
import Home from './pages/Home';
import HomeworkLibrary from './pages/HomeworkLibrary';
import InstructorBookingCalendar from './pages/InstructorBookingCalendar';
import InstructorChats from './pages/InstructorChats';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorMcqReporting from './pages/InstructorMcqReporting';
import InstructorNotifications from './pages/InstructorNotifications';
import InstructorPupilNotes from './pages/InstructorPupilNotes';
import InstructorPupilNotesList from './pages/InstructorPupilNotesList';
import InstructorResources from './pages/InstructorResources';
import InstructorTopicAssignment from './pages/InstructorTopicAssignment';
import LearnerBookingCalendar from './pages/LearnerBookingCalendar';
import LearnerCalendar from './pages/LearnerCalendar';
import LearnerChats from './pages/LearnerChats';
import LearnerDashboard from './pages/LearnerDashboard';
import LearnerHomework from './pages/LearnerHomework';
import LearnerLessons from './pages/LearnerLessons';
import LearnerNotes from './pages/LearnerNotes';
import LearnerNotifications from './pages/LearnerNotifications';
import LearnerProgress from './pages/LearnerProgress';
import LearnerResources from './pages/LearnerResources';
import LearnerScheduledLessons from './pages/LearnerScheduledLessons';
import LearnerSkillStudy from './pages/LearnerSkillStudy';
import LearnerSkills from './pages/LearnerSkills';
import LessonTermsAndConditions from './pages/LessonTermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfileSettings from './pages/ProfileSettings';
import PupilList from './pages/PupilList';
import PupilProfile from './pages/PupilProfile';
import RefundPolicy from './pages/RefundPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountDeletionRequest": AccountDeletionRequest,
    "AdminDataManagement": AdminDataManagement,
    "AdminInstructorCalendars": AdminInstructorCalendars,
    "Calendar": Calendar,
    "CourseWork": CourseWork,
    "CourseWorkDetail": CourseWorkDetail,
    "DVSASkillDetail": DVSASkillDetail,
    "DVSASkills": DVSASkills,
    "Home": Home,
    "HomeworkLibrary": HomeworkLibrary,
    "InstructorBookingCalendar": InstructorBookingCalendar,
    "InstructorChats": InstructorChats,
    "InstructorDashboard": InstructorDashboard,
    "InstructorMcqReporting": InstructorMcqReporting,
    "InstructorNotifications": InstructorNotifications,
    "InstructorPupilNotes": InstructorPupilNotes,
    "InstructorPupilNotesList": InstructorPupilNotesList,
    "InstructorResources": InstructorResources,
    "InstructorTopicAssignment": InstructorTopicAssignment,
    "LearnerBookingCalendar": LearnerBookingCalendar,
    "LearnerCalendar": LearnerCalendar,
    "LearnerChats": LearnerChats,
    "LearnerDashboard": LearnerDashboard,
    "LearnerHomework": LearnerHomework,
    "LearnerLessons": LearnerLessons,
    "LearnerNotes": LearnerNotes,
    "LearnerNotifications": LearnerNotifications,
    "LearnerProgress": LearnerProgress,
    "LearnerResources": LearnerResources,
    "LearnerScheduledLessons": LearnerScheduledLessons,
    "LearnerSkillStudy": LearnerSkillStudy,
    "LearnerSkills": LearnerSkills,
    "LessonTermsAndConditions": LessonTermsAndConditions,
    "PrivacyPolicy": PrivacyPolicy,
    "ProfileSettings": ProfileSettings,
    "PupilList": PupilList,
    "PupilProfile": PupilProfile,
    "RefundPolicy": RefundPolicy,
    "TermsAndConditions": TermsAndConditions,
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
    Layout: __Layout,
};