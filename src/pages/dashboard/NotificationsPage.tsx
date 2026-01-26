// src/pages/dashboard/NotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '../../services/notificationService';
import { authService } from '../../services/auth/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Bell, CheckCircle, Info, AlertTriangle, Trash2, MailOpen } from 'lucide-react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    //@ts-ignore
    const _navigate = useNavigate();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupSubscription = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user && user.email) {
                    // Start real-time subscription for the collection
                    unsubscribe = notificationService.subscribeToUserNotifications(
                        user.email,
                        (collectionNotifications) => {
                            // When collection updates, also fetch doc-based ones (less frequent)
                            // or just use the subscriber which is already robust if we want.
                            // Actually, getUnifiedNotifications is a one-shot fetch.
                            // To be truly real-time for everything, we'd need a subscriber for the doc too.
                            // But for now, let's just use the subscriber which covers the most common case (collection).
                            setNotifications(collectionNotifications);
                            setLoading(false);
                        }
                    );
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error setting up notifications subscription:", error);
                setLoading(false);
            }
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleMarkAsRead = async (id: string) => {
        const user = await authService.getCurrentUser();
        if (user && user.email) {
            // Try collection first
            await notificationService.markAsRead(id);
            // And document
            await notificationService.markUserNotificationAsRead(user.email, id);

            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
        }
    };

    const handleMarkAllAsRead = async () => {
        const user = await authService.getCurrentUser();
        if (user && user.email) {
            await notificationService.markEverythingAsRead(user.email);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    if (loading) {
        return <LoadingSpinner size="lg" text="Chargement des notifications..." />;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Notifications</h1>
                    <p className="text-gray-500 mt-1">Retrouvez ici toutes vos alertes et messages.</p>
                </div>
                <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors"
                >
                    <MailOpen size={18} />
                    Marquer tout comme lu
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {notifications.map(notif => (
                            <NotificationItem key={notif.id} notification={notif} onMarkAsRead={handleMarkAsRead} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-20">
                        <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-secondary">Boîte de réception vide</h3>
                        <p className="text-gray-500 mt-2">Vous n'avez aucune nouvelle notification pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Composant pour un item de notification
const NotificationItem = ({ notification, onMarkAsRead }: { notification: Notification, onMarkAsRead: (id: string) => void }) => {
    const navigate = useNavigate();

    const icons: Record<string, React.ReactElement> = {
        success: <CheckCircle className="text-green-500" />,
        reminder: <Bell className="text-yellow-500" />,
        alert: <AlertTriangle className="text-red-500" />,
        info: <Info className="text-blue-500" />,
        reservation: <Bell className="text-orange-500" />,
        reservation_update: <Info className="text-indigo-500" />,
        loan_validated: <CheckCircle className="text-green-600" />,
        loan_returned: <CheckCircle className="text-blue-600" />,
        penalty: <AlertTriangle className="text-red-600" />,
        error: <AlertTriangle className="text-red-500" />,
    };

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const formatTimestamp = (ts: any) => {
        if (!ts) return '';
        if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString('fr-FR');
        if (ts instanceof Date) return ts.toLocaleString('fr-FR');
        return new Date(ts).toLocaleString('fr-FR');
    };

    return (
        <li
            onClick={handleClick}
            className={`flex items-start gap-4 p-6 transition-all duration-300 cursor-pointer ${notification.read ? 'bg-white' : 'bg-primary/5 hover:bg-primary/10'
                }`}
        >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                {icons[notification.type] || <Info className="text-blue-500" />}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-secondary">{notification.title}</h4>
                    {!notification.read && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" title="Non lue"></div>
                    )}
                </div>
                <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">
                    {formatTimestamp(notification.timestamp)}
                </span>
            </div>
            <button className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} />
            </button>
        </li>
    );
};

export default NotificationsPage;