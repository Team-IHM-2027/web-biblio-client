import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
// import DebugConfig from './components/DebugConfig';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
//import NotFoundPage from './pages/NotFoundPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProfilePage from './pages/dashboard/Profile';
import ReservationsPage from './pages/dashboard/EmpruntsPage.tsx';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import HistoryPage from './pages/dashboard/ConsultationsPage';
import ChatPage from './pages/dashboard/ChatPage';
import BookDetailsPage from './pages/BookDetailsPage';
import AuthPage from "./pages/AuthPage.tsx";
import BooksPage from "./pages/BooksPage.tsx";
import ThesisPage from "./pages/ThesisPage.tsx";
import ThesisDetailsPage from "./pages/ThesisDetailsPage.tsx";
import AidePage from "./pages/AidePage.tsx";
import ClientAlertModal from './components/common/ClientAlertModal';

const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
        ],
    },
    {
        path: '/auth',
        element: <AuthPage />,
    },
    {
        path: '/books',
        element: <BooksPage />,
    },
    {
        path: '/books/:id',
        element: <BookDetailsPage />,
    },
    {
        path: '/thesis',
        element: <ThesisPage />,
    },
    {
        path: '/thesis/:id',
        element: <ThesisDetailsPage />,
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <ProfilePage />,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'Chat',
                element: <ChatPage />,
            },
            {
                path: 'consultations',
                element: <HistoryPage />,
            },
            {
                path: 'notifications',
                element: <NotificationsPage />,
            },
            {
                path: 'emprunts',
                element: <ReservationsPage />,
            },
        ],
    },
    {
        path: 'helps',
        element: <AidePage />,
    },
]);

function App() {
    return (
        <ConfigProvider>
            <RouterProvider router={router} />
            <ClientAlertModal />
            {/*<DebugConfig />*/}
        </ConfigProvider>
    );
}

export default App;
