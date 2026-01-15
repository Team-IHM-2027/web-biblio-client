import { db } from '../configs/firebase';
import { notificationService } from './notificationService';
import {
    doc,
    updateDoc,
    getDoc,
    arrayUnion,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';

export class ReservationService {
    private readonly userCollection = 'BiblioUser';
    private readonly booksCollection = 'BiblioBooks';

    async reserveBook(bookId: string, currentUser: any): Promise<{ success: boolean; message: string; slotNumber?: number }> {
        try {
            if (!currentUser) {
                throw new Error('Vous devez être connecté pour réserver un livre');
            }

            // Vérifier le livre
            const bookRef = doc(db, this.booksCollection, bookId);
            const bookSnap = await getDoc(bookRef);

            if (!bookSnap.exists()) {
                throw new Error('Livre non trouvé');
            }

            const bookData = bookSnap.data();
            const bookTitle = bookData.name || 'Livre sans titre';
            const availableCopies = bookData.exemplaire || 0;

            if (availableCopies <= 0) {
                throw new Error('Aucun exemplaire disponible pour ce livre');
            }

            // Trouver un slot disponible (vous avez seulement etat1-3)
            const userRef = doc(db, this.userCollection, currentUser.email);
            const userSnap = await getDoc(userRef);

            let availableSlot = null;
            if (userSnap.exists()) {
                const userData = userSnap.data();
                // Chercher dans etat1 à etat3 seulement
                for (let i = 1; i <= 3; i++) {
                    const stateKey = `etat${i}`;
                    if (!userData[stateKey] || userData[stateKey] === 'ras' || userData[stateKey] === '') {
                        availableSlot = i;
                        break;
                    }
                }
            }

            if (!availableSlot) {
                throw new Error('Vous avez atteint le nombre maximum de réservations (3 maximum)');
            }

            // Créer le tabEtat array selon votre structure
            const tabData = [
                bookId,                                  // 0: bookId
                bookTitle,                               // 1: book name (adjusted)
                bookData.cathegorie || 'General',       // 2: category (using cathegorie)
                bookData.image || '',                   // 3: image URL (using image)
                this.booksCollection,                    // 4: collection name
                new Date().toISOString(),                // 5: timestamp
                1                                        // 6: exemplaire count
            ];

            // Mise à jour simultanée
            await updateDoc(userRef, {
                [`etat${availableSlot}`]: 'reserv',
                [`tabEtat${availableSlot}`]: tabData,
                // Ajouter aussi à l'array reservations si vous l'utilisez
                reservations: arrayUnion({
                    bookId: bookId,
                    name: bookTitle,
                    cathegorie: bookData.cathegorie || 'General',
                    image: bookData.image || '',
                    nomBD: this.booksCollection,
                    dateReservation: new Date(),
                    etat: 'reserv',
                    exemplaire: 1
                })
            });

            // Réduire les exemplaires disponibles
            await updateDoc(bookRef, {
                exemplaire: Math.max(0, availableCopies - 1)
            });

            // Créer une notification pour les bibliothécaires
            // Vous devez ajuster notificationService.createReservationNotification
            // pour correspondre à votre structure Notifications
            await this.createReservationNotification(
                currentUser.userId || currentUser.uid,
                currentUser.name || userSnap.data()?.name || 'Utilisateur',
                currentUser.email,
                bookId,
                bookTitle
            );

            return {
                success: true,
                message: 'Livre réservé avec succès. En attente de validation du bibliothécaire.',
                slotNumber: availableSlot
            };

        } catch (error: any) {
            console.error('Reservation error:', error);
            return {
                success: false,
                message: error.message || 'Erreur lors de la réservation'
            };
        }
    }

    async createReservationNotification(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string
    ): Promise<void> {
        try {
            const notificationsRef = collection(db, 'Notifications');
            await addDoc(notificationsRef, {
                type: 'reservation_request',
                read: false,
                processed: false,
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                bookId: bookId,
                bookTitle: bookTitle,
                createdAt: new Date(),
                status: 'pending',
                recipientId: 'admin' // ou tous les bibliothécaires
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async approveReservation(userEmail: string, slotNumber: number, notificationId: string, librarianName: string, bookId: string, bookTitle: string, userId: string): Promise<void> {
        try {
            const userRef = doc(db, this.userCollection, userEmail);

            // Mettre à jour l'état de l'utilisateur de 'reserv' à 'emprunt'
            await updateDoc(userRef, {
                [`etat${slotNumber}`]: 'emprunt'
            });

            // Calculate due date (3 days from now)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 3);

            // Traiter la notification
            await this.processReservationNotification(
                notificationId,
                'approved',
                librarianName
            );

            // Send loan validated notification with 3-day warning
            await notificationService.sendLoanValidated(
                userId,
                bookId,
                bookTitle,
                dueDate,
                librarianName
            );

        } catch (error) {
            console.error('Error approving reservation:', error);
            throw error;
        }
    }

    async rejectReservation(
        userEmail: string,
        slotNumber: number,
        bookId: string,
        notificationId: string,
        librarianName: string,
        reason: string
    ): Promise<void> {
        try {
            const userRef = doc(db, this.userCollection, userEmail);
            const bookRef = doc(db, this.booksCollection, bookId);

            // Réinitialiser le slot de l'utilisateur
            await updateDoc(userRef, {
                [`etat${slotNumber}`]: 'ras',
                [`tabEtat${slotNumber}`]: []
            });

            // Restaurer l'exemplaire du livre
            const bookSnap = await getDoc(bookRef);
            if (bookSnap.exists()) {
                const bookData = bookSnap.data();
                const currentCopies = bookData.exemplaire || 0;
                await updateDoc(bookRef, {
                    exemplaire: currentCopies + 1
                });
            }

            // Traiter la notification
            await this.processReservationNotification(
                notificationId,
                'rejected',
                librarianName,
                reason
            );

        } catch (error) {
            console.error('Error rejecting reservation:', error);
            throw error;
        }
    }

    async processReservationNotification(
        notificationId: string,
        status: 'approved' | 'rejected',
        librarianName: string,
        reason?: string
    ): Promise<void> {
        const notificationRef = doc(db, 'Notifications', notificationId);
        await updateDoc(notificationRef, {
            processed: true,
            read: true,
            status: status,
            processedBy: librarianName,
            processedAt: new Date(),
            ...(reason && { rejectionReason: reason })
        });
    }

    async getPendingReservationCount(): Promise<number> {
        try {
            const q = query(
                collection(db, 'Notifications'),
                where('type', '==', 'reservation_request'),
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
}

export const reservationService = new ReservationService();