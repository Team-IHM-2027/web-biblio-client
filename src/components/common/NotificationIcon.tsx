// src/components/common/NotificationIcon.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { BiblioUser } from '../../types/auth';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebase';

interface Props {
  currentUser: BiblioUser | null;
  maxVisible?: number;
}

export interface NotificationItem {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info' | 'reservation' | 'reservation_update' | 'reservation_request' | 'reservation_approved' | 'reservation_rejected' | 'loan_validated' | 'loan_returned' | 'penalty' | 'reminder' | 'emprunt' | 'retour' | 'annulation' | 'rappel' | 'nouveau_livre';
  title?: string;
  message?: string;
  date: any; // Timestamp or serialized date
  read: boolean;
  link?: string;
  bookId?: string;
  bookTitle?: string;
}

const NotificationIcon: React.FC<Props> = ({ currentUser, maxVisible = 6 }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close popup on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  // Subscribe to Notifications via Firestore Collection
  useEffect(() => {
    if (!currentUser?.email) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const notificationsRef = collection(db, 'Notifications');

      // Query by userEmail (primary)
      const q = query(
        notificationsRef,
        where('userEmail', '==', currentUser.email)
      );

      // Set up the snapshot listener for userEmail
      const unsubscribe = onSnapshot(
        q,
        async (querySnapshot) => {
          const notifs: NotificationItem[] = [];

          // Add notifications from userEmail query
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            notifs.push({
              id: docSnap.id,
              type: data.type || 'info',
              title: data.title,
              message: data.message,
              date: data.date || data.createdAt || data.timestamp,
              read: data.read || false,
              link: data.link,
              bookId: data.bookId,
              bookTitle: data.bookTitle,
            });
          });

          // Also query by userId as fallback (in case some notifications were stored with userId instead of userEmail)
          try {
            const qByUserId = query(
              notificationsRef,
              where('userId', '==', currentUser.email)
            );
            const userIdSnapshot = await getDocs(qByUserId);

            userIdSnapshot.forEach((docSnap) => {
              // Only add if not already in notifs (avoid duplicates)
              if (!notifs.find(n => n.id === docSnap.id)) {
                const data = docSnap.data();
                notifs.push({
                  id: docSnap.id,
                  type: data.type || 'info',
                  title: data.title,
                  message: data.message,
                  date: data.date || data.createdAt || data.timestamp,
                  read: data.read || false,
                  link: data.link,
                  bookId: data.bookId,
                  bookTitle: data.bookTitle,
                });
              }
            });
          } catch (err) {
            console.error('Error querying by userId:', err);
          }

          // Sort by date (newest first)
          const sortedNotifications = notifs.sort((a, b) => {
            const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date || 0);
            const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
          });

          setNotifications(sortedNotifications);
          setLoading(false);  // Mark loading as done
        },
        (error) => {
          console.error('Erreur lors de la récupération des notifications:', error);
          setLoading(false);  // Mark loading as done even on error
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setLoading(false);
    }
  }, [currentUser?.email]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(prev => !prev);
  };

  const getTimeAgo = (dateInput: any) => {
    if (!dateInput) return '';

    let date: Date;
    if (dateInput?.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString();
  };

  // Mark a single notification as read in Firestore
  const markAsRead = async (notifId: string) => {
    if (!currentUser?.email) return;

    try {
      const notifRef = doc(db, 'Notifications', notifId);
      await updateDoc(notifRef, {
        read: true,
        readAt: new Date()
      });
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUser?.email || notifications.length === 0) return;

    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      const promises = unreadNotifs.map(n => {
        const notifRef = doc(db, 'Notifications', n.id);
        return updateDoc(notifRef, {
          read: true,
          readAt: new Date()
        });
      });

      await Promise.all(promises);
      // Update local state immediately
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Erreur lors du marquage de tous comme lus:', err);
    }
  };

  // Delete a single notification from Firestore
  const deleteNotification = async (notificationToDelete: NotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentUser?.email) return;

    setDeletingId(notificationToDelete.id);
    try {
      // Actually delete from Notifications collection
      const notifRef = doc(db, 'Notifications', notificationToDelete.id);
      await deleteDoc(notifRef);  // Use deleteDoc instead of updateDoc

      // Remove from UI immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-xs text-white rounded-full flex items-center justify-center font-semibold"
            style={{ backgroundColor: '#ef4444', minWidth: 18, height: 18, padding: '0 4px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-96 max-h-[80vh] overflow-auto bg-white rounded-lg shadow-xl border border-gray-100 z-50"
          onClick={(ev) => ev.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10">
            <div className="font-semibold text-gray-800">
              Notifications {unreadCount > 0 && <span className="text-sm text-gray-500">({unreadCount} non lues)</span>}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={(ev) => { ev.stopPropagation(); markAllAsRead(); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  title="Marquer tout comme lu"
                >
                  Marquer tout lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-2">
            {loading && (
              <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">Aucune notification</div>
            )}

            {!loading && notifications.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {notifications.slice(0, maxVisible).map((n) => (
                  <li
                    key={n.id}
                    className={`px-3 py-3 flex items-start gap-3 transition-colors ${n.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                  >
                    {/* Unread indicator dot */}
                    {!n.read && (
                      <div className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#3b82f6' }} />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {n.title || 'Notification'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {n.message}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                          {getTimeAgo(n.date)}
                        </div>

                        <div className="flex items-center gap-1">
                          {!n.read && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); markAsRead(n.id); }}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Marquer comme lu"
                            >
                              Marquer lu
                            </button>
                          )}
                          <button
                            onClick={(ev) => deleteNotification(n, ev)}
                            className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            {deletingId === n.id ? (
                              <span className="text-xs">⏳</span>
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!loading && notifications.length > maxVisible && (
              <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                <Link
                  to="/dashboard/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setOpen(false)}
                >
                  Voir toutes les notifications ({notifications.length})
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;