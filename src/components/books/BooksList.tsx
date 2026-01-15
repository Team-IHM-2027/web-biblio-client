
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import BookCard, { BiblioBook } from './BookCard';
import { SortOption, ViewMode } from './BooksSortOptions';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    RefreshCw,
    AlertCircle,
    Search
} from 'lucide-react';

interface SearchFilters {
    query: string;
    author: string;
    publisher: string;
    category: string;
    yearFrom: string;
    yearTo: string;
}

interface BooksListProps {
    searchFilters: SearchFilters;
    selectedDepartments: string[];
    sortOption: SortOption;
    viewMode: ViewMode;
    onBookReserve?: (bookId: string) => void;
    onToggleFavorite?: (bookId: string) => void;
    favoriteBooks?: string[];
    className?: string;
}

const BooksList: React.FC<BooksListProps> = ({
    searchFilters,
    selectedDepartments,
    sortOption,
    viewMode,
    onToggleFavorite,
    favoriteBooks = [],
    className = ""
}) => {
    const { orgSettings } = useConfig();
    const { currentUser } = useAuth();
    const [allBooks, setAllBooks] = useState<BiblioBook[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<BiblioBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const BOOKS_PER_PAGE = 12;

    const loadAllBooks = async () => {
        try {
            setLoading(true);
            setError('');

            // Requête correcte avec la bonne collection
            const booksQuery = query(
                collection(db, 'BiblioBooks'),
                orderBy('name', 'asc')
            );

            const querySnapshot = await getDocs(booksQuery);
            const books: BiblioBook[] = [];

            querySnapshot.forEach((doc) => {
                const bookData = { id: doc.id, ...doc.data() } as BiblioBook;
                books.push(bookData);
            });

            setAllBooks(books);

        } catch {
            setError('Erreur lors du chargement des livres. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    // Charger les livres au montage
    useEffect(() => {
        loadAllBooks();
    }, []);

    // Appliquer les filtres et le tri côté client
    useEffect(() => {
        let filtered = [...allBooks];

        // 1. Filtrer par départements (utilise "cathegorie")
        if (selectedDepartments.length > 0) {
            filtered = filtered.filter(book =>
                selectedDepartments.includes(book.cathegorie)
            );
        }

        // 2. Filtrer par recherche textuelle
        if (searchFilters.query.trim()) {
            const searchTerm = searchFilters.query.toLowerCase();
            filtered = filtered.filter(book =>
                book.name.toLowerCase().includes(searchTerm) ||
                book.auteur.toLowerCase().includes(searchTerm) ||
                book.cathegorie.toLowerCase().includes(searchTerm) ||
                (book.desc && book.desc.toLowerCase().includes(searchTerm))
            );
        }

        // 3. Filtres avancés
        if (searchFilters.author.trim()) {
            filtered = filtered.filter(book =>
                book.auteur.toLowerCase().includes(searchFilters.author.toLowerCase())
            );
        }

        if (searchFilters.publisher.trim()) {
            filtered = filtered.filter(book =>
                book.edition && book.edition.toLowerCase().includes(searchFilters.publisher.toLowerCase())
            );
        }

        if (searchFilters.category.trim()) {
            filtered = filtered.filter(book =>
                book.cathegorie.toLowerCase().includes(searchFilters.category.toLowerCase())
            );
        }

        // 4. Appliquer le tri
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'title-asc':
                    return a.name.localeCompare(b.name);
                case 'title-desc':
                    return b.name.localeCompare(a.name);
                case 'availability-desc':
                    return b.exemplaire - a.exemplaire;
                default:
                    return 0;
            }
        });

        setFilteredBooks(filtered);
        setCurrentPage(1);

    }, [allBooks, searchFilters, selectedDepartments, sortOption]);

    // Calculer les statistiques
    const totalExemplaires = allBooks.reduce((sum, book) => sum + book.exemplaire, 0);
    const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
    const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;
    const currentBooks = filteredBooks.slice(startIndex, endIndex);

    // Navigation des pages
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Recharger les données
    const handleRefresh = () => {
        loadAllBooks();
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <LoadingSpinner size="lg" text="Chargement des livres..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-xl border border-red-200 p-8 text-center ${className}`}>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: primaryColor }}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                </button>
            </div>
        );
    }

    if (filteredBooks.length === 0) {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 p-12 text-center ${className}`}>
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${primaryColor}10` }}
                >
                    <Search className="w-10 h-10" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun livre trouvé</h3>
                <p className="text-gray-600 mb-6">
                    Aucun livre ne correspond à vos critères de recherche.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                    <p>• Vérifiez l'orthographe de vos mots-clés</p>
                    <p>• Utilisez des termes plus généraux</p>
                    <p>• Réduisez le nombre de filtres</p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* En-tête avec statistiques */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-gray-400" />
                    <span className="text-gray-600">
                        {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''} • {totalExemplaires} exemplaires au total
                        {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
                    </span>
                </div>

                <button
                    onClick={handleRefresh}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Actualiser"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Grille/Liste des livres */}
            <div className={`${viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
                }`}>
                {currentBooks.map((book) => (
                    <BookCard
                        key={book.id}
                        book={book}
                        viewMode={viewMode}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={favoriteBooks.includes(book.id)}
                        userLoggedIn={!!currentUser}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center">
                    <div
                        className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === totalPages}
                            className={`p-3 transition-colors ${currentPage === totalPages
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={`p-3 transition-colors ${currentPage === totalPages
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                    </div>
                </div>
            )}

            {/* Informations sur la pagination */}
            {filteredBooks.length > BOOKS_PER_PAGE && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Affichage
                    de {startIndex + 1} à {Math.min(endIndex, filteredBooks.length)} sur {filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default BooksList;
