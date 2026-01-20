import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
import DashboardLayout from './layouts/DashboardLayout';
import ProfilePage from './pages/dashboard/Profile';
import ReservationsPage from './pages/dashboard/EmpruntsPage.tsx';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import HistoryPage from './pages/dashboard/ConsultationsPage';
import MessagesPage from './pages/dashboard/MessagesPage.tsx';
import { ChatWindow } from './components/chat/ChatWindow';
import BookDetailsPage from './pages/BookDetailsPage';
import AuthPage from "./pages/AuthPage.tsx";
import BooksPage from "./pages/BooksPage.tsx";
import ThesisPage from "./pages/ThesisPage.tsx";
import ThesisDetailsPage from "./pages/ThesisDetailsPage.tsx";
import AidePage from "./pages/AidePage.tsx";
import ClientAlertModal from './components/common/ClientAlertModal';
import BlockingAlertPage from './pages/BlockingAlertPage';

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
        path: '/blocked',
        element: <BlockingAlertPage />,
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
                path: 'messages',
                element: <MessagesPage />,
                children: [
                    {
                        path: ':conversationId',
                        element: <ChatWindow />
                    }
                ]
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
            <AuthProvider>
                <RouterProvider router={router} />
                <ClientAlertModal />
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
