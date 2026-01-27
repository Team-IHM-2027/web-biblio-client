import React from 'react';
import BookCard, { BiblioBook } from './BookCard';
import { Sparkles } from 'lucide-react';

interface RecommendedBooksProps {
    books: BiblioBook[];
    loading: boolean;
    onBookClick?: (bookId: string) => void;
}

const RecommendedBooks: React.FC<RecommendedBooksProps> = ({ books, loading, onBookClick }) => {
    if (loading) {
        return (
            <div className="mt-12 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!books || books.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 border-t border-gray-100 pt-12">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                    Recommandés pour vous
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {books.map((book) => (
                    <div key={book.id} onClick={() => onBookClick && onBookClick(book.id)}>
                        <BookCard
                            book={book}
                            viewMode="grid"
                            // We disable direct actions for simplicity in recommendation view,
                            // or we can keep them. Let's keep them enabled but we might need 
                            // to pass handlers if we want full functionality.
                            // For now, minimal props to display.
                            isLoading={false}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedBooks;
