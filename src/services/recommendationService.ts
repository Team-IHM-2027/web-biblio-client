import { db } from '../configs/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    doc,
    getDoc,
    documentId
} from 'firebase/firestore';
import { BiblioBook } from '../components/books/BookCard';
import { BiblioUser } from '../types/auth';

class RecommendationService {
    private readonly booksCollection = 'BiblioBooks';
    private readonly userCollection = 'BiblioUser';
    private readonly API_URL = 'https://recommendation.up.railway.app';

    /**
     * Get recommended books based on user's reservation history
     */
    async getRecommendedBooks(userId: string, currentBookId: string, maxResults: number = 4): Promise<BiblioBook[]> {
        try {
            // Priority 1: External API
            try {
                const apiRecommendations = await this.getRecommendationsFromApi(userId, currentBookId, maxResults);
                if (apiRecommendations.length > 0) {
                    return apiRecommendations;
                }
            } catch (err) {
                console.warn('External recommendation API failed, falling back to internal logic:', err);
            }

            // Priority 2: Internal History Logic
            return await this.getInternalRecommendations(userId, currentBookId, maxResults);

        } catch (error) {
            console.error("Error getting recommendations:", error);
            // Priority 3: Recent Books Fallback
            return this.getRecentBooks(currentBookId, maxResults);
        }
    }

    /**
     * Fetch recommendations from external API
     */
    async getRecommendationsFromApi(userId: string, currentBookId: string, maxResults: number): Promise<BiblioBook[]> {
        // Construct the URL. Assuming the API takes user_id as query param.
        const url = new URL(this.API_URL);
        url.searchParams.append('user_id', userId);
        // url.searchParams.append('book_id', currentBookId); // Uncomment if needed

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();

            // Expected format: array of strings (book IDs) or objects with 'id' or 'book_id'
            let bookIds: string[] = [];

            if (Array.isArray(data)) {
                bookIds = data.map((item: any) => {
                    if (typeof item === 'string') return item;
                    if (typeof item === 'object' && item.id) return item.id;
                    if (typeof item === 'object' && item.book_id) return item.book_id;
                    return null;
                }).filter(id => id);
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.recommendations)) {
                    bookIds = data.recommendations.map((item: any) =>
                        typeof item === 'string' ? item : (item.id || item.book_id)
                    ).filter((id: any) => id);
                }
            }

            if (bookIds.length === 0) {
                return [];
            }

            // Note: 'in' query supports max 10 items.
            const filteredIds = bookIds.filter(id => id !== currentBookId).slice(0, 10);

            if (filteredIds.length === 0) {
                return [];
            }

            const booksRef = collection(db, this.booksCollection);
            const q = query(booksRef, where(documentId(), 'in', filteredIds));
            const snapshot = await getDocs(q);

            const books: BiblioBook[] = [];
            snapshot.forEach(doc => {
                books.push({ id: doc.id, ...doc.data() } as BiblioBook);
            });

            // Reorder books to match the API recommendation order
            const orderedBooks = filteredIds
                .map(id => books.find(b => b.id === id))
                .filter((b): b is BiblioBook => !!b)
                .slice(0, maxResults);

            return orderedBooks;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Internal logic based on user history
     */
    async getInternalRecommendations(userId: string, currentBookId: string, maxResults: number): Promise<BiblioBook[]> {
        if (!userId) {
            return this.getRecentBooks(currentBookId, maxResults);
        }

        try {
            // 1. Get user's reservation history
            const userRef = doc(db, this.userCollection, userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
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

            const sortedCategories = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat]) => cat);

            if (sortedCategories.length === 0) {
                return this.getRecentBooks(currentBookId, maxResults);
            }

            // 3. Query books matching top categories
            const topCategory = sortedCategories[0];

            const booksRef = collection(db, this.booksCollection);
            const q = query(
                booksRef,
                where('cathegorie', '==', topCategory),
                limit(maxResults + 1)
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
            console.error("Error in internal recommendations:", error);
            return this.getRecentBooks(currentBookId, maxResults);
        }
    }

    /**
     * Fallback: Get recent books
     */
    async getRecentBooks(currentBookId: string, count: number, excludeIds: string[] = []): Promise<BiblioBook[]> {
        try {
            const booksRef = collection(db, this.booksCollection);
            const q = query(booksRef, limit(count + 5));

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
