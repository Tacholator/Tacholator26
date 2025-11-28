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
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
    Layout: __Layout,
};