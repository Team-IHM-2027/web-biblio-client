import { db } from '../configs/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    doc,
    getDoc
} from 'firebase/firestore';
import { BiblioBook } from '../components/books/BookCard';
import { BiblioUser } from '../types/auth';

class RecommendationService {
    private readonly booksCollection = 'BiblioBooks';
    private readonly userCollection = 'BiblioUser';

    /**
     * Get recommended books based on user's reservation history
     */
    async getRecommendedBooks(userId: string, currentBookId: string, maxResults: number = 4): Promise<BiblioBook[]> {
        try {
            if (!userId) {
                return this.getRecentBooks(currentBookId, maxResults);
            }

            // 1. Get user's reservation history
            const userRef = doc(db, this.userCollection, userId); // Note: check if userId or email is used as ID. Assuming email based on reservationService
            // Actually, let's double check if userId passed directly is the doc ID. 
            // In reservationService it uses currentUser.email as doc ID. 
            // I will assume userId passed here might be the email or I need to handle both.
            // Let's try to get by the ID passed first.
            let userSnap = await getDoc(userRef);

            // If not found, it might be that the ID passed is a UID but doc ID is email.
            // But usually we should pass the correct ID. Let's assume the caller passes the correct doc ID (likely email for BiblioUser).

            if (!userSnap.exists()) {
                // Fallback if user not found or no history
                return this.getRecentBooks(currentBookId, maxResults);
            }

            const userData = userSnap.data() as BiblioUser;
            const reservations = userData.reservations || [];

            if (reservations.length === 0) {
                return this.getRecentBooks(currentBookId, maxResults);
            }

            // 2. Extract preferred categories
            const categoryCounts: Record<string, number> = {};
            reservations.forEach(res => {
                const cat = res.cathegorie;
                if (cat) {
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                }
            });

            // Sort categories by frequency
            const sortedCategories = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat]) => cat);

            if (sortedCategories.length === 0) {
                return this.getRecentBooks(currentBookId, maxResults);
            }

            // 3. Query books matching top categories
            // We'll try the top category first
            const topCategory = sortedCategories[0];

            const booksRef = collection(db, this.booksCollection);
            const q = query(
                booksRef,
                where('cathegorie', '==', topCategory),
                limit(maxResults + 1) // Fetch one extra to handle exclusion of current book
            );

            const snapshot = await getDocs(q);
            const recommendedBooks: BiblioBook[] = [];

            snapshot.forEach(doc => {
                if (doc.id !== currentBookId && recommendedBooks.length < maxResults) {
                    recommendedBooks.push({ id: doc.id, ...doc.data() } as BiblioBook);
                }
            });

            // If we don't have enough, fill with recent books
            if (recommendedBooks.length < maxResults) {
                const recent = await this.getRecentBooks(currentBookId, maxResults - recommendedBooks.length, recommendedBooks.map(b => b.id));
                recommendedBooks.push(...recent);
            }

            return recommendedBooks;

        } catch (error) {
            console.error("Error getting recommendations:", error);
            // Fallback to recent books on error
            return this.getRecentBooks(currentBookId, maxResults);
        }
    }

    /**
     * Fallback: Get recent books
     */
    async getRecentBooks(currentBookId: string, count: number, excludeIds: string[] = []): Promise<BiblioBook[]> {
        try {
            const booksRef = collection(db, this.booksCollection);
            // We assume there might be a date field, if not we just take any valid ones.
            // 'dateCreation' or just default order. Let's use limit.
            const q = query(booksRef, limit(count + 5)); // Fetch extra

            const snapshot = await getDocs(q);
            const books: BiblioBook[] = [];
            const allExcluded = [currentBookId, ...excludeIds];

            snapshot.forEach(doc => {
                if (!allExcluded.includes(doc.id) && books.length < count) {
                    books.push({ id: doc.id, ...doc.data() } as BiblioBook);
                }
            });

            return books;
        } catch (error) {
            console.error("Error fetching recent books:", error);
            return [];
        }
    }
}

export const recommendationService = new RecommendationService();
