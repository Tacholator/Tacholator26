import InstructorDashboard from './pages/InstructorDashboard';
import Calendar from './pages/Calendar';
import PupilList from './pages/PupilList';
import PupilProfile from './pages/PupilProfile';
import LearnerDashboard from './pages/LearnerDashboard';
import LearnerProgress from './pages/LearnerProgress';
import LearnerLessons from './pages/LearnerLessons';
import LearnerHomework from './pages/LearnerHomework';


export const PAGES = {
    "InstructorDashboard": InstructorDashboard,
    "Calendar": Calendar,
    "PupilList": PupilList,
    "PupilProfile": PupilProfile,
    "LearnerDashboard": LearnerDashboard,
    "LearnerProgress": LearnerProgress,
    "LearnerLessons": LearnerLessons,
    "LearnerHomework": LearnerHomework,
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
};