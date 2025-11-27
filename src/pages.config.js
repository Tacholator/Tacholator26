import InstructorDashboard from './pages/InstructorDashboard';
import Calendar from './pages/Calendar';
import PupilList from './pages/PupilList';
import PupilProfile from './pages/PupilProfile';


export const PAGES = {
    "InstructorDashboard": InstructorDashboard,
    "Calendar": Calendar,
    "PupilList": PupilList,
    "PupilProfile": PupilProfile,
}

export const pagesConfig = {
    mainPage: "InstructorDashboard",
    Pages: PAGES,
};