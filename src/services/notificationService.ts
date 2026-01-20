import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    writeBatch,
    doc,
    updateDoc,
    Timestamp,
    onSnapshot,
    deleteDoc,
    getDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../configs/firebase';

// Types pour les notifications
export interface BaseNotification {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    type: 'success' | 'warning' | 'info' | 'error' | 'reservation' | 'reservation_update' | 'loan_validated' | 'loan_returned' | 'penalty' | 'reminder';
    title: string;
    message: string;
    read: boolean;
    timestamp: any;
    link?: string;
    data?: any;
}

export interface ReservationNotificationData {
    bookId: string;
    bookTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
    requestDate: string;
    priority?: 'normal' | 'urgent';
    slotNumber?: number;
    requestType?: 'reservation' | 'loan';
}

export interface ReservationNotification extends BaseNotification {
    type: 'reservation';
    userName: string;
    userEmail: string;
    processed?: boolean;
    decision?: 'approved' | 'rejected';
    processedBy?: string;
    processedAt?: any;
    reason?: string;
    data: ReservationNotificationData;
}

export interface ReservationUpdateNotification extends BaseNotification {
    type: 'reservation_update';
    data: {
        bookId: string;
        bookTitle: string;
        status: 'approved' | 'rejected';
        reason?: string;
        librarianName?: string;
        updateDate: string;
    };
}

export interface LoanValidatedNotification extends BaseNotification {
    type: 'loan_validated';
    data: {
        bookId: string;
        bookTitle: string;
        loanDate: string;
        dueDate: string;
        librarianName?: string;
        reminderSent?: boolean;
    };
}

export interface LoanReturnedNotification extends BaseNotification {
    type: 'loan_returned';
    data: {
        bookId: string;
        bookTitle: string;
        returnDate: string;
        librarianName?: string;
    };
}

export interface PenaltyNotification extends BaseNotification {
    type: 'penalty';
    data: {
        bookId: string;
        bookTitle: string;
        daysOverdue: number;
        amount: number;
        date: string;
    };
}

export interface ReminderNotification extends BaseNotification {
    type: 'reminder';
    data: {
        bookId: string;
        bookTitle: string;
        dueDate: string;
        reminderDate: string;
        daysLeft: number;
    };
}

// Union type for all notification types
export type Notification = BaseNotification | ReservationNotification | ReservationUpdateNotification | LoanValidatedNotification | LoanReturnedNotification | PenaltyNotification | ReminderNotification;

class NotificationService {
    public librarianName = 'Bibliothécaire';
    private readonly collectionName = 'Notifications';
    private readonly librarianNotificationCollection = 'LibrarianNotifications';

    /**
     * Ajoute une notification pour un utilisateur dans son document BiblioUser
     */
    async addUserNotification(userIdOrEmail: string, data: Omit<BaseNotification, 'id' | 'read' | 'timestamp' | 'userId'>): Promise<string> {
        try {
            // Dans ce système, l'ID utilisateur est soit son email, soit son UID
            let userRef = doc(db, 'BiblioUser', userIdOrEmail);
            let userSnap = await getDoc(userRef);

            // Fallback si non trouvé (ex: on a l'UID mais le doc est indexé par email, ou vice versa)
            // Note: Si on n'a que l'un des deux, on fait au mieux.
            // Si data contient userEmail, on peut essayer ça aussi
            if (!userSnap.exists() && (data as any).userEmail && (data as any).userEmail !== userIdOrEmail) {
                userRef = doc(db, 'BiblioUser', (data as any).userEmail);
                userSnap = await getDoc(userRef);
            }

            const newNotification = {
                id: Math.random().toString(36).substr(2, 9),
                ...data,
                read: false,
                date: Timestamp.now(), // Utilisation de 'date' pour correspondre à NotificationIcon.tsx
            };

            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    notifications: arrayUnion(newNotification)
                });
                console.log(`✅ Notification ajoutée au document de l'utilisateur ${userIdOrEmail}`);
            } else {
                // Si vraiment non trouvé dans BiblioUser, on l'ajoute à la collection Notifications
                throw new Error("User document not found");
            }

            return newNotification.id;
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout de la notification au document utilisateur:", error);
            // Fallback: essayer de créer dans la collection Notifications si le document n'existe pas ou erreur
            try {
                const notificationCollection = collection(db, this.collectionName);
                const docRef = await addDoc(notificationCollection, {
                    ...data,
                    userId: userIdOrEmail,
                    userEmail: userIdOrEmail, // Ensure userEmail is always set (userId is the email)
                    read: false,
                    timestamp: Timestamp.now(),
                    createdAt: Timestamp.now()  // Also add createdAt for consistency
                });
                console.log(`✅ Notification créée dans la collection Notifications: ${docRef.id}`);
                return docRef.id;
            } catch (fallbackError) {
                console.error("❌ Erreur fallback notification:", fallbackError);
                throw error;
            }
        }
    }
    /**
     * Crée une notification de réservation pour un bibliothécaire
     */
    async createReservationNotification(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string,
        slotNumber?: number,
        requestType: 'reservation' | 'loan' = 'reservation'
    ): Promise<string> {
        try {
            const notificationCollection = collection(db, this.librarianNotificationCollection);

            const notificationData = {
                userId: 'librarians', // Special ID for all librarians
                userName: userName,
                userEmail: userEmail,
                type: requestType === 'loan' ? 'loan_request' : 'reservation',
                title: requestType === 'loan' ? '📖 Nouvelle demande d\'emprunt' : '📚 Nouvelle demande de réservation',
                message: requestType === 'loan'
                    ? `${userName} souhaite emprunter "${bookTitle}"`
                    : `${userName} souhaite réserver "${bookTitle}"`,
                read: false,
                processed: false,
                data: {
                    bookId,
                    bookTitle,
                    userId,
                    userEmail,
                    userName,
                    requestDate: new Date().toISOString(),
                    slotNumber,
                    priority: 'normal' as const,
                    requestType
                }
            };

            const docRef = await addDoc(notificationCollection, {
                ...notificationData,
                timestamp: Timestamp.now()
            });

            console.log(`📚 Notification ${requestType === 'loan' ? 'd\'emprunt' : 'de réservation'} créée: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification de réservation:", error);
            throw error;
        }
    }

    /**
     * Crée une notification de demande d'emprunt pour un bibliothécaire
     */
    async createLoanRequestNotification(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string
    ): Promise<string> {
        try {
            return await this.createReservationNotification(
                userId,
                userName,
                userEmail,
                bookId,
                bookTitle,
                undefined,
                'loan'
            );
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification d'emprunt:", error);
            throw error;
        }
    }

    /**
     * Envoie une mise à jour de réservation à l'utilisateur
     */
    async sendReservationUpdate(
        userId: string,
        bookId: string,
        bookTitle: string,
        status: 'approved' | 'rejected',
        reason?: string,
        librarianName?: string
    ): Promise<string> {
        try {
            const notificationId = await this.addUserNotification(userId, {
                type: 'reservation_update',
                title: status === 'approved'
                    ? '✅ Réservation approuvée'
                    : '❌ Réservation refusée',
                message: status === 'approved'
                    ? `Votre réservation pour "${bookTitle}" a été approuvée${librarianName ? ` par ${librarianName}` : ''}.`
                    : `Votre réservation pour "${bookTitle}" a été refusée${reason ? `: ${reason}` : ''}.`,
                userEmail: userId, // This will be in the data object passed to addDoc
                data: {
                    bookId,
                    bookTitle,
                    status,
                    reason,
                    librarianName,
                    updateDate: new Date().toISOString()
                }
            });

            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la mise à jour de réservation:", error);
            throw error;
        }
    }

    /**
     * Envoie une notification de validation de prêt avec rappel de 3 jours
     */
    async sendLoanValidated(
        userId: string,
        bookId: string,
        bookTitle: string,
        dueDate: Date,
        librarianName?: string
    ): Promise<string> {
        try {
            const dueDateString = dueDate.toLocaleDateString('fr-FR');
            const notificationId = await this.addUserNotification(userId, {
                type: 'loan_validated',
                title: '📖 Prêt Validé',
                message: `Votre prêt pour "${bookTitle}" a été validé. Veuillez le retourner avant le ${dueDateString} pour éviter des pénalités.`,
                userEmail: userId, // ADD THIS
                data: {
                    bookId,
                    bookTitle,
                    loanDate: new Date().toISOString(),
                    dueDate: dueDate.toISOString(),
                    librarianName,
                    reminderSent: false
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de prêt:", error);
            throw error;
        }
    }

    async sendLoanReturned(
        userId: string,
        bookId: string,
        bookTitle: string,
        librarianName?: string
    ): Promise<string> {
        try {
            const notificationId = await this.addUserNotification(userId, {
                type: 'loan_returned',
                title: '✅ Retour Confirmé',
                message: `Le retour du livre "${bookTitle}" a été confirmé avec succès. Merci !`,
                userEmail: userId, // ADD THIS
                data: {
                    bookId,
                    bookTitle,
                    returnDate: new Date().toISOString(),
                    librarianName
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de retour:", error);
            throw error;
        }
    }

    async sendPenaltyNotification(
        userId: string,
        bookId: string,
        bookTitle: string,
        daysOverdue: number,
        amount: number
    ): Promise<string> {
        try {
            const notificationId = await this.addUserNotification(userId, {
                type: 'penalty',
                title: '⚠️ Pénalité de Retard',
                message: `Vous avez ${daysOverdue} jours de retard pour "${bookTitle}". Une pénalité de ${amount} FCFA a été appliquée.`,
                userEmail: userId, // ADD THIS
                data: {
                    bookId,
                    bookTitle,
                    daysOverdue,
                    amount,
                    date: new Date().toISOString()
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de pénalité:", error);
            throw error;
        }
    }

    async sendReminderNotification(
        userId: string,
        bookId: string,
        bookTitle: string,
        dueDate: Date
    ): Promise<string> {
        try {
            const dueDateString = dueDate.toLocaleDateString('fr-FR');
            const notificationId = await this.addUserNotification(userId, {
                type: 'reminder',
                title: '⏰ Rappel de retour',
                message: `Le livre "${bookTitle}" doit être retourné avant le ${dueDateString}. Il reste 3 jours.`,
                userEmail: userId, // ADD THIS
                data: {
                    bookId,
                    bookTitle,
                    dueDate: dueDate.toISOString(),
                    reminderDate: new Date().toISOString(),
                    daysLeft: 3
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de rappel:", error);
            throw error;
        }
    }

    /**
     * Écoute les nouvelles notifications pour un utilisateur (temps réel)
     */
    subscribeToUserNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ): () => void {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifications = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const notification = {
                        id: doc.id,
                        ...data
                    } as Notification;

                    // Handle different notification types with proper typing
                    return this.normalizeNotification(notification);
                });

                callback(notifications);
            }, (error) => {
                console.error('Error in user notifications subscription:', error);
                callback([]);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up user notifications subscription:', error);
            return () => { };
        }
    }


    /**
     * Normalize notification data to ensure proper typing
     */
    private normalizeNotification(notification: Notification): Notification {
        const data = notification.data || {};

        switch (notification.type) {
            case 'reservation_update':
                return {
                    ...notification,
                    type: 'reservation_update',
                    data: {
                        bookId: data.bookId || '',
                        bookTitle: data.bookTitle || '',
                        status: data.status || 'rejected',
                        reason: data.reason,
                        librarianName: data.librarianName,
                        updateDate: data.updateDate || new Date().toISOString()
                    }
                } as ReservationUpdateNotification;

            case 'loan_validated':
                return {
                    ...notification,
                    type: 'loan_validated',
                    data: {
                        bookId: data.bookId || '',
                        bookTitle: data.bookTitle || '',
                        loanDate: data.loanDate || new Date().toISOString(),
                        dueDate: data.dueDate || new Date().toISOString(),
                        librarianName: data.librarianName,
                        reminderSent: data.reminderSent || false
                    }
                } as LoanValidatedNotification;

            case 'loan_returned':
                return {
                    ...notification,
                    type: 'loan_returned',
                    data: {
                        bookId: data.bookId || '',
                        bookTitle: data.bookTitle || '',
                        returnDate: data.returnDate || new Date().toISOString(),
                        librarianName: data.librarianName
                    }
                } as LoanReturnedNotification;

            case 'penalty':
                return {
                    ...notification,
                    type: 'penalty',
                    data: {
                        bookId: data.bookId || '',
                        bookTitle: data.bookTitle || '',
                        daysOverdue: data.daysOverdue || 0,
                        amount: data.amount || 0,
                        date: data.date || new Date().toISOString()
                    }
                } as PenaltyNotification;

            case 'reminder':
                return {
                    ...notification,
                    type: 'reminder',
                    data: {
                        bookId: data.bookId || '',
                        bookTitle: data.bookTitle || '',
                        dueDate: data.dueDate || new Date().toISOString(),
                        reminderDate: data.reminderDate || new Date().toISOString(),
                        daysLeft: data.daysLeft || 3
                    }
                } as ReminderNotification;

            default:
                return notification;
        }
    }

    /**
     * Écoute les nouvelles demandes de réservation (pour les bibliothécaires)
     */
    subscribeToReservationRequests(callback: (notifications: ReservationNotification[]) => void): () => void {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            // onSnapshot returns an unsubscribe function
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifications = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');

                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'reservation',
                        title: data.title || (requestType === 'loan' ? '📖 Demande d\'emprunt' : '📚 Demande de réservation'),
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: {
                            bookId: data.data?.bookId || data.bookId || '',
                            bookTitle: data.data?.bookTitle || data.bookTitle || '',
                            userId: data.data?.userId || data.userId || '',
                            userEmail: data.data?.userEmail || data.userEmail || '',
                            userName: data.data?.userName || data.userName || '',
                            requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                            requestType: requestType,
                            slotNumber: data.data?.slotNumber || data.slotNumber,
                            priority: data.data?.priority || 'normal'
                        } as ReservationNotificationData
                    } as ReservationNotification;
                });
                callback(notifications);
            }, (error) => {
                console.error('Error in subscription:', error);
                // You might want to callback with empty array on error
                callback([]);
            });

            return unsubscribe; // This is the unsubscribe function
        } catch (error) {
            console.error('Error setting up subscription:', error);
            // Return a dummy unsubscribe function
            return () => { };
        }
    }

    /**
     * Traite une demande de réservation (approuver ou refuser)
     */
    async processReservationRequest(
        notificationId: string,
        decision: 'approved' | 'rejected',
        librarianName: string,
        reason?: string,
        dueDate?: Date // Added for loan approvals
    ): Promise<void> {
        try {
            const notifRef = doc(db, this.librarianNotificationCollection, notificationId);
            const notificationSnap = await getDoc(notifRef);

            if (!notificationSnap.exists()) {
                throw new Error('Notification non trouvée');
            }

            const notification = notificationSnap.data();
            const isLoanRequest = notification.type === 'loan_request' || notification.data?.requestType === 'loan';

            // Marquer comme traitée
            await updateDoc(notifRef, {
                processed: true,
                decision,
                processedBy: librarianName,
                processedAt: Timestamp.now(),
                reason: reason || '',
                read: true
            });

            // Envoyer une notification à l'utilisateur
            // Use userEmail from the notification data (this is what NotificationIcon queries by)
            const userEmail = notification.data?.userEmail || notification.userEmail;

            if (!userEmail) {
                throw new Error('Email utilisateur manquant dans la notification');
            }

            if (notification.data) {
                if (isLoanRequest) {
                    if (decision === 'approved' && dueDate) {
                        // Envoyer une notification de prêt validé
                        await this.sendLoanValidated(
                            userEmail,  // CHANGE: use userEmail instead of userId
                            notification.data.bookId,
                            notification.data.bookTitle,
                            dueDate,
                            librarianName
                        );
                    } else if (decision === 'rejected') {
                        // Envoyer une notification de refus d'emprunt
                        await this.sendReservationUpdate(
                            userEmail,  // CHANGE: use userEmail instead of userId
                            notification.data.bookId,
                            notification.data.bookTitle,
                            'rejected',
                            reason,
                            librarianName
                        );
                    }
                } else {
                    // Pour les réservations normales
                    await this.sendReservationUpdate(
                        userEmail,  // CHANGE: use userEmail instead of userId
                        notification.data.bookId,
                        notification.data.bookTitle,
                        decision,
                        reason,
                        librarianName
                    );
                }
            }

            console.log(`✅ Demande ${isLoanRequest ? 'd\'emprunt' : 'de réservation'} traitée: ${decision}`);
        } catch (error) {
            console.error("❌ Erreur lors du traitement de la demande de réservation:", error);
            throw error;
        }
    }

    /**
     * Marque une notification spécifique comme lue
     */
    async markAsRead(notificationId: string, collectionName: string = this.collectionName): Promise<void> {
        try {
            const notifRef = doc(db, collectionName, notificationId);
            await updateDoc(notifRef, {
                read: true,
                readAt: Timestamp.now()
            });
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de la notification:", error);
        }
    }

    /**
     * Marque une notification spécifique dans le document utilisateur comme lue
     */
    async markUserNotificationAsRead(userIdOrEmail: string, notificationId: string): Promise<void> {
        try {
            let userRef = doc(db, 'BiblioUser', userIdOrEmail);
            let userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // On n'a pas forcément l'email ici, donc on s'arrête si non trouvé
                // Sauf si on veut chercher par email via une query, mais c'est lourd.
                console.warn(`⚠️ Document utilisateur ${userIdOrEmail} non trouvé pour marquer la notification comme lue`);
                return;
            }

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const notifications = userData.notifications || [];

                const updatedNotifications = notifications.map((notification: any) => {
                    if (notification.id === notificationId) {
                        return {
                            ...notification,
                            read: true,
                            readAt: Timestamp.now()
                        };
                    }
                    return notification;
                });

                await updateDoc(userRef, {
                    notifications: updatedNotifications
                });
            }
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de la notification utilisateur:", error);
        }
    }

    /**
     * Marque toutes les notifications non lues d'un utilisateur comme lues
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return;

            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    read: true,
                    readAt: Timestamp.now()
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de toutes les notifications:", error);
        }
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des notifications non lues:", error);
            return 0;
        }
    }

    /**
     * Récupère le nombre de demandes de réservation en attente (pour les bibliothécaires)
     */
    async getPendingReservationCount(): Promise<number> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);

            let count = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');
                if (requestType === 'reservation') {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des réservations en attente:", error);
            return 0;
        }
    }

    /**
     * Récupère le nombre de demandes d'emprunt en attente (pour les bibliothécaires)
     */
    async getPendingLoanCount(): Promise<number> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);

            let count = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');
                if (requestType === 'loan') {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des emprunts en attente:", error);
            return 0;
        }
    }

    /**
     * Récupère le nombre total de demandes en attente (pour les bibliothécaires)
     */
    async getTotalPendingCount(): Promise<number> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error("❌ Erreur lors du comptage total des demandes en attente:", error);
            return 0;
        }
    }

    /**
     * Supprime une notification
     */
    async deleteNotification(notificationId: string, collectionName: string = this.collectionName): Promise<void> {
        try {
            await deleteDoc(doc(db, collectionName, notificationId));
        } catch (error) {
            console.error("❌ Erreur lors de la suppression de la notification:", error);
            throw error;
        }
    }

    /**
     * Supprime une notification du document utilisateur
     */
    async deleteUserNotification(userId: string, notificationId: string): Promise<void> {
        try {
            const userRef = doc(db, 'BiblioUser', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const notifications = userData.notifications || [];

                const updatedNotifications = notifications.filter((notification: any) =>
                    notification.id !== notificationId
                );

                await updateDoc(userRef, {
                    notifications: updatedNotifications
                });
            }
        } catch (error) {
            console.error("❌ Erreur lors de la suppression de la notification utilisateur:", error);
            throw error;
        }
    }

    /**
     * Récupère les notifications pour un utilisateur donné
     */
    async getNotificationsForUser(userId: string, count: number = 50): Promise<Notification[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(count)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return this.normalizeNotification({
                    id: doc.id,
                    ...data
                } as Notification);
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des notifications:", error);
            return [];
        }
    }

    /**
     * Récupère les notifications depuis le document utilisateur
     */
    async getNotificationsFromUserDoc(userId: string): Promise<Notification[]> {
        try {
            const userRef = doc(db, 'BiblioUser', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const notifications = userData.notifications || [];

                return notifications.map((notification: any) => {
                    return {
                        ...notification,
                        // Ensure proper typing based on the notification type
                        type: notification.type,
                        read: notification.read || false,
                        timestamp: notification.date || Timestamp.now()
                    } as Notification;
                });
            }
            return [];
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des notifications du document utilisateur:", error);
            return [];
        }
    }

    /**
     * Récupère toutes les demandes de réservation en attente
     */
    async getPendingReservations(): Promise<ReservationNotification[]> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');

                return {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || '',
                    userEmail: data.userEmail || data.data?.userEmail || '',
                    type: 'reservation',
                    title: data.title || '',
                    message: data.message || '',
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || false,
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: {
                        bookId: data.data?.bookId || data.bookId || '',
                        bookTitle: data.data?.bookTitle || data.bookTitle || '',
                        userId: data.data?.userId || data.userId || '',
                        userEmail: data.data?.userEmail || data.userEmail || '',
                        userName: data.data?.userName || data.userName || '',
                        requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                        requestType: requestType,
                        slotNumber: data.data?.slotNumber || data.slotNumber,
                        priority: data.data?.priority || 'normal'
                    } as ReservationNotificationData
                } as ReservationNotification;
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des réservations en attente:", error);
            return [];
        }
    }

    /**
     * Récupère les demandes de réservation traitées
     */
    async getProcessedReservations(): Promise<ReservationNotification[]> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('processed', '==', true),
                orderBy('processedAt', 'desc'),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');

                return {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || '',
                    userEmail: data.userEmail || data.data?.userEmail || '',
                    type: 'reservation',
                    title: data.title || '',
                    message: data.message || '',
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || false,
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: {
                        bookId: data.data?.bookId || data.bookId || '',
                        bookTitle: data.data?.bookTitle || data.bookTitle || '',
                        userId: data.data?.userId || data.userId || '',
                        userEmail: data.data?.userEmail || data.userEmail || '',
                        userName: data.data?.userName || data.userName || '',
                        requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                        requestType: requestType,
                        slotNumber: data.data?.slotNumber || data.slotNumber,
                        priority: data.data?.priority || 'normal'
                    } as ReservationNotificationData
                } as ReservationNotification;
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des réservations traitées:", error);
            return [];
        }
    }

    /**
     * Filtre les notifications par type
     */
    filterNotificationsByType(notifications: Notification[], type: Notification['type']): Notification[] {
        return notifications.filter(notification => notification.type === type);
    }

    /**
     * Filtre les notifications non lues
     */
    filterUnreadNotifications(notifications: Notification[]): Notification[] {
        return notifications.filter(notification => !notification.read);
    }

    /**
     * Filtre les notifications de prêt en cours (loan_validated avec date de retour future)
     */
    filterActiveLoans(notifications: Notification[]): LoanValidatedNotification[] {
        const today = new Date();
        return notifications.filter(notification => {
            if (notification.type === 'loan_validated') {
                const loanNotification = notification as LoanValidatedNotification;
                const dueDate = new Date(loanNotification.data.dueDate);
                return dueDate > today;
            }
            return false;
        }) as LoanValidatedNotification[];
    }

    /**
     * Filtre les notifications de prêt en retard
     */
    filterOverdueLoans(notifications: Notification[]): (LoanValidatedNotification | PenaltyNotification)[] {
        const today = new Date();
        return notifications.filter(notification => {
            if (notification.type === 'loan_validated') {
                const loanNotification = notification as LoanValidatedNotification;
                const dueDate = new Date(loanNotification.data.dueDate);
                return dueDate < today;
            }
            return notification.type === 'penalty';
        }) as (LoanValidatedNotification | PenaltyNotification)[];
    }

    /**
     * Helper method to get pending reservations from a list
     */
    getPendingReservationsFromList(notifications: ReservationNotification[]): ReservationNotification[] {
        return notifications.filter(n =>
            !n.read && (n.processed === undefined || n.processed === false)
        );
    }

    /**
     * Helper method to get processed reservations from a list
     */
    getProcessedReservationsFromList(notifications: ReservationNotification[]): ReservationNotification[] {
        return notifications.filter(n => n.processed === true);
    }

    /**
     * Envoie une notification simple à un utilisateur
     */
    async sendSimpleNotification(
        userId: string,
        type: BaseNotification['type'],
        title: string,
        message: string,
        link?: string
    ): Promise<string> {
        return this.addUserNotification(userId, {
            type,
            title,
            message,
            link
        });
    }

    /**
     * Vérifie et envoie des rappels pour les prêts qui arrivent à échéance dans 3 jours
     */
    async checkAndSendReminders(userId: string): Promise<void> {
        try {
            // Récupérer toutes les notifications de prêt validé
            const notifications = await this.getNotificationsForUser(userId, 100);
            const activeLoans = this.filterActiveLoans(notifications);

            const today = new Date();

            for (const loan of activeLoans) {
                const dueDate = new Date(loan.data.dueDate);
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                // Envoyer un rappel si dans 3 jours et pas encore envoyé
                if (daysUntilDue <= 3 && daysUntilDue > 0 && !loan.data.reminderSent) {
                    await this.sendReminderNotification(
                        userId,
                        loan.data.bookId,
                        loan.data.bookTitle,
                        dueDate
                    );

                    // Marquer le rappel comme envoyé
                    const notificationRef = doc(db, this.collectionName, loan.id);
                    await updateDoc(notificationRef, {
                        'data.reminderSent': true
                    });
                }
            }
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des rappels:", error);
        }
    }
    async getUnifiedNotifications(userId: string): Promise<Notification[]> {
        try {
            const [collectionNotifs, docNotifs] = await Promise.all([
                this.getNotificationsForUser(userId, 100),
                this.getNotificationsFromUserDoc(userId)
            ]);
            const allNotifs = [...collectionNotifs, ...docNotifs];
            const uniqueNotifs = Array.from(new Map(allNotifs.map(item => [item.id, item])).values());
            return uniqueNotifs.sort((a, b) => {
                const dateA = a.timestamp?.seconds || (typeof a.timestamp === 'object' && a.timestamp && 'getTime' in a.timestamp ? (a.timestamp as any).getTime() / 1000 : 0);
                const dateB = b.timestamp?.seconds || (typeof b.timestamp === 'object' && b.timestamp && 'getTime' in b.timestamp ? (b.timestamp as any).getTime() / 1000 : 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error("❌ Erreur unified notifications:", error);
            return [];
        }
    }

    async markEverythingAsRead(userId: string): Promise<void> {
        try {
            await Promise.all([
                this.markAllAsRead(userId),
                this.markAllUserNotificationsAsRead(userId)
            ]);
        } catch (error) {
            console.error("❌ Erreur markEverythingAsRead:", error);
        }
    }

    private async markAllUserNotificationsAsRead(userId: string): Promise<void> {
        try {
            const userRef = doc(db, 'BiblioUser', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const notifications = userSnap.data().notifications || [];
                const updated = notifications.map((n: any) => ({ ...n, read: true, readAt: Timestamp.now() }));
                await updateDoc(userRef, { notifications: updated });
            }
        } catch (error) {
            console.error("❌ Erreur markAllUserNotificationsAsRead:", error);
        }
    }
}

export const notificationService = new NotificationService();
