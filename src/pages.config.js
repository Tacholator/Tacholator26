import InstructorDashboard from './pages/InstructorDashboard';
import Calendar from './pages/Calendar';
import PupilList from './pages/PupilList';
import PupilProfile from './pages/PupilProfile';
import LearnerDashboard from './pages/LearnerDashboard';
import LearnerProgress from './pages/LearnerProgress';
import LearnerLessons from './pages/LearnerLessons';
import LearnerHomework from './pages/LearnerHomework';
import ProfileSettings from './pages/ProfileSettings';
import InstructorResources from './pages/InstructorResources';
import LearnerResources from './pages/LearnerResources';
import AdminDataManagement from './pages/AdminDataManagement';
import HomeworkLibrary from './pages/HomeworkLibrary';
import DVSASkills from './pages/DVSASkills';
import DVSASkillDetail from './pages/DVSASkillDetail';
import LearnerSkills from './pages/LearnerSkills';
import LearnerSkillStudy from './pages/LearnerSkillStudy';
import InstructorChats from './pages/InstructorChats';
import LearnerChats from './pages/LearnerChats';
import InstructorNotifications from './pages/InstructorNotifications';
import LearnerNotifications from './pages/LearnerNotifications';
import AccountDeletionRequest from './pages/AccountDeletionRequest';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CourseWork from './pages/CourseWork';
import CourseWorkDetail from './pages/CourseWorkDetail';
import InstructorTopicAssignment from './pages/InstructorTopicAssignment';
import __Layout from './Layout.jsx';


export const PAGES = {
    "InstructorDashboard": InstructorDashboard,
    "Calendar": Calendar,
    "PupilList": PupilList,
    "PupilProfile": PupilProfile,
    "LearnerDashboard": LearnerDashboard,
    "LearnerProgress": LearnerProgress,
    "LearnerLessons": LearnerLessons,
    "LearnerHomework": LearnerHomework,
    "ProfileSettings": ProfileSettings,
    "InstructorResources": InstructorResources,
    "LearnerResources": LearnerResources,
    "AdminDataManagement": AdminDataManagement,
    "HomeworkLibrary": HomeworkLibrary,
    "DVSASkills": DVSASkills,
    "DVSASkillDetail": DVSASkillDetail,
    "LearnerSkills": LearnerSkills,
    "LearnerSkillStudy": LearnerSkillStudy,
    "InstructorChats": InstructorChats,
    "LearnerChats": LearnerChats,
    "InstructorNotifications": InstructorNotifications,
    "LearnerNotifications": LearnerNotifications,
    "AccountDeletionRequest": AccountDeletionRequest,
    "TermsAndConditions": TermsAndConditions,
    "PrivacyPolicy": PrivacyPolicy,
    "CourseWork": CourseWork,
    "CourseWorkDetail": CourseWorkDetail,
    "InstructorTopicAssignment": InstructorTopicAssignment,
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
    Layout: __Layout,
};