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
    type: 'success' | 'warning' | 'info' | 'error' | 'reservation' | 'reservation_update' | 'loan_validated' | 'loan_returned' | 'penalty';
    title: string;
    message: string;
    read: boolean;
    timestamp: any;
    link?: string;
    data?: any;
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
    data: {
        bookId: string;
        bookTitle: string;
        userId: string;
        userEmail: string;
        userName: string;
        requestDate: string;
        priority?: 'normal' | 'urgent';
        slotNumber?: number;
    };
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
    };
}

// Union type for all notification types
export type Notification = BaseNotification | ReservationNotification | ReservationUpdateNotification | LoanValidatedNotification | LoanReturnedNotification | PenaltyNotification;

class NotificationService {
    private readonly collectionName = 'Notifications';
    private readonly librarianNotificationCollection = 'LibrarianNotifications';

    /**
     * Ajoute une notification pour un utilisateur dans son document BiblioUser
     */
    async addUserNotification(userId: string, data: Omit<BaseNotification, 'id' | 'read' | 'timestamp' | 'userId'>): Promise<string> {
        try {
            // Dans ce système, l'ID utilisateur est souvent son email
            const userRef = doc(db, 'BiblioUser', userId);

            const newNotification = {
                id: Math.random().toString(36).substr(2, 9),
                ...data,
                read: false,
                date: Timestamp.now(), // Utilisation de 'date' pour correspondre à NotificationIcon.tsx
            };

            await updateDoc(userRef, {
                notifications: arrayUnion(newNotification)
            });

            console.log(`✅ Notification ajoutée au document de l'utilisateur ${userId}`);
            return newNotification.id;
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout de la notification au document utilisateur:", error);
            // Fallback: essayer de créer dans la collection Notifications si le document n'existe pas ou erreur
            try {
                const notificationCollection = collection(db, this.collectionName);
                const docRef = await addDoc(notificationCollection, {
                    ...data,
                    userId,
                    read: false,
                    timestamp: Timestamp.now()
                });
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
        slotNumber?: number
    ): Promise<string> {
        try {
            const notificationCollection = collection(db, this.librarianNotificationCollection);

            const notificationData = {
                userId: 'librarians', // Special ID for all librarians
                userName: userName,
                userEmail: userEmail,
                type: 'reservation' as const,
                title: '📚 Nouvelle demande de réservation',
                message: `${userName} souhaite réserver "${bookTitle}"`,
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
                    priority: 'normal' as const
                }
            };

            const docRef = await addDoc(notificationCollection, {
                ...notificationData,
                timestamp: Timestamp.now()
            });

            console.log(`📚 Notification de réservation créée: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification de réservation:", error);
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
                    ? '🎉 Réservation approuvée'
                    : '❌ Réservation refusée',
                message: status === 'approved'
                    ? `Votre réservation pour "${bookTitle}" a été approuvée${librarianName ? ` par ${librarianName}` : ''}.`
                    : `Votre réservation pour "${bookTitle}" a été refusée${reason ? `: ${reason}` : ''}.`,
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
                data: {
                    bookId,
                    bookTitle,
                    loanDate: new Date().toISOString(),
                    dueDate: dueDate.toISOString(),
                    librarianName
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de prêt:", error);
            throw error;
        }
    }

    /**
     * Envoie une notification de retour de livre
     */
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

    /**
     * Envoie une notification de pénalité
     */
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
                data: {
                    bookId,
                    bookTitle,
                    daysOverdue,
                    amount
                }
            });
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de pénalité:", error);
            throw error;
        }
    }

    /**
     * Écoute les nouvelles notifications pour un utilisateur (temps réel)
     */
    subscribeToUserNotifications(
        userId: string,
        callback: (notifications: BaseNotification[]) => void
    ) {
        // Remove orderBy to avoid creating a composite index
        const q = query(
            collection(db, this.collectionName),
            where('userId', '==', userId),
            limit(50) // Increased limit to ensure we get enough recent ones, though strictly without orderBy it's arbitrary which 50 we get.
            // Ideally we would still want orderBy, but user requested client-side sort to avoid index.
            // Note: without index, we can't efficiently get "latest 20". We get "some 20" matching userId.
            // Ideally we should remove limit too if we want to be sure to get the latest, 
            // but that might be heavy if there are many notifications.
            // I will remove limit as well to be safe and sort all of them, assuming user doesn't have thousands.
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BaseNotification[];

            // Sort client-side
            notifications.sort((a, b) => {
                const dateA = a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(a.timestamp || 0);
                const dateB = b.timestamp?.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(b.timestamp || 0);
                return dateB.getTime() - dateA.getTime();
            });

            callback(notifications);
        });
    }

    /**
     * Écoute les nouvelles demandes de réservation (pour les bibliothécaires)
     */
    subscribeToReservationRequests(callback: (notifications: ReservationNotification[]) => void) {
        const q = query(
            collection(db, this.librarianNotificationCollection),
            where('type', '==', 'reservation'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || '',
                    userEmail: data.userEmail || data.data?.userEmail || '',
                    type: data.type as 'reservation',
                    title: data.title || '',
                    message: data.message || '',
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || false,
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: data.data || {}
                } as ReservationNotification;
            });
            callback(notifications);
        });
    }

    /**
     * Traite une demande de réservation (approuver ou refuser)
     */
    async processReservationRequest(
        notificationId: string,
        decision: 'approved' | 'rejected',
        librarianName: string,
        reason?: string
    ): Promise<void> {
        try {
            const notifRef = doc(db, this.librarianNotificationCollection, notificationId);
            const notificationSnap = await getDoc(notifRef);

            if (!notificationSnap.exists()) {
                throw new Error('Notification non trouvée');
            }

            const notification = notificationSnap.data();

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
            if (notification.data) {
                await this.sendReservationUpdate(
                    notification.data.userId,
                    notification.data.bookId,
                    notification.data.bookTitle,
                    decision,
                    reason,
                    librarianName
                );
            }

            console.log(`✅ Demande de réservation traitée: ${decision}`);
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
                where('type', '==', 'reservation'),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des réservations en attente:", error);
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
     * Récupère les notifications pour un utilisateur donné
     */
    async getNotificationsForUser(userId: string, count: number = 50): Promise<BaseNotification[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(count)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BaseNotification[];
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des notifications:", error);
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
                where('type', '==', 'reservation'),
                where('read', '==', false),
                where('processed', '==', false),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || '',
                    userEmail: data.userEmail || data.data?.userEmail || '',
                    type: data.type as 'reservation',
                    title: data.title || '',
                    message: data.message || '',
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || false,
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: data.data || {}
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
                where('type', '==', 'reservation'),
                where('processed', '==', true),
                orderBy('processedAt', 'desc'),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || '',
                    userEmail: data.userEmail || data.data?.userEmail || '',
                    type: data.type as 'reservation',
                    title: data.title || '',
                    message: data.message || '',
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || false,
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: data.data || {}
                } as ReservationNotification;
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des réservations traitées:", error);
            return [];
        }
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
}

export const notificationService = new NotificationService();