import { useState, useEffect } from 'react';
import { Book, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { useSafeAuth } from '../../hooks/useSafeAuth';

import BookCard, { BiblioBook } from '../books/BookCard';
import ThesisCard from '../thesis/ThesisCard';
import { BiblioThesis } from '../../types/thesis';

const ResourcesSection: React.FC = () => {
    const { orgSettings } = useConfig();
    const { currentUser } = useSafeAuth();
    const [books, setBooks] = useState<BiblioBook[]>([]);
    const [theses, setTheses] = useState<BiblioThesis[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
    const [favoriteTheses, setFavoriteTheses] = useState<string[]>([]);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';

    useEffect(() => {
        const fetchResources = async (): Promise<void> => {
            try {
                // Récupérer les livres (limité à 8 pour l'affichage)
                const booksQuery = query(
                    collection(db, 'BiblioBooks'),
                    limit(8)
                );
                const booksSnapshot = await getDocs(booksQuery);
                const booksData: BiblioBook[] = booksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as BiblioBook));

                // Récupérer les mémoires (limité à 8 pour l'affichage)
                const thesesQuery = query(
                    collection(db, 'BiblioThesis'),
                    limit(8)
                );
                const thesesSnapshot = await getDocs(thesesQuery);
                const thesesData: BiblioThesis[] = thesesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as BiblioThesis));

                setBooks(booksData);
                setTheses(thesesData);
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des ressources:', error);
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    const handleThesisView = async (thesisId: string) => {
        try {
            console.log('📖 Consultation du mémoire:', thesisId);
            // Rediriger vers la page de détails ou ouvrir le PDF
            window.open(`/thesis/${thesisId}`, '_blank');
        } catch (error) {
            console.error('Erreur consultation mémoire:', error);
        }
    };

    const handleToggleBookFavorite = (bookId: string) => {
        setFavoriteBooks(prev =>
            prev.includes(bookId)
                ? prev.filter(id => id !== bookId)
                : [...prev, bookId]
        );
    };

    const handleToggleThesisFavorite = (thesisId: string) => {
        setFavoriteTheses(prev =>
            prev.includes(thesisId)
                ? prev.filter(id => id !== thesisId)
                : [...prev, thesisId]
        );
    };

    const LoadingSkeleton: React.FC<{ type?: 'book' | 'thesis' }> = ({ type = 'book' }) => (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {type === 'book' ? (
                <>
                    <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </>
            ) : (
                <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <section id="resources-section" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-16 h-1 rounded-full"
                                style={{
                                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                                }}
                            />
                        </div>
                        <h2 className="text-4xl font-bold mb-6" style={{ color: secondaryColor }}>
                            Nos Ressources Académiques
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Chargement des ressources depuis notre base de données...
                        </p>
                    </div>

                    {/* Loading Skeletons */}
                    <div className="mb-20">
                        <div className="flex items-center mb-8">
                            <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <LoadingSkeleton key={i} type="book" />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <LoadingSkeleton key={i} type="thesis" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="resources-section" className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-1 rounded-full"
                            style={{
                                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                            }}
                        />
                    </div>
                    <h2 className="text-4xl font-bold mb-6" style={{ color: secondaryColor }}>
                        Nos Ressources Académiques
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Explorez notre vaste collection de livres académiques et de mémoires de recherche
                        pour enrichir vos connaissances et alimenter vos recherches.
                    </p>
                </div>

                {/* Books Section */}
                <div className="mb-20">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <Book className="w-6 h-6" style={{ color: primaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                                    Livres Académiques
                                </h3>
                                <p className="text-gray-600">
                                    {books.length > 0 ? `${books.length} livre${books.length > 1 ? 's' : ''} disponible${books.length > 1 ? 's' : ''}` : 'Collection de livres spécialisés par domaine'}
                                </p>
                            </div>
                        </div>

                        <a
                            href="/books"
                            className="flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                            style={{
                                backgroundColor: `${primaryColor}10`,
                                color: primaryColor
                            }}
                        >
                            Voir tous les livres
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                    </div>

                    {books.length > 0 ? (
                        <>
                            {/* Grille principale avec BookCard */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
                                {books.slice(0, 4).map((book) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        viewMode="grid"
                                        onToggleFavorite={handleToggleBookFavorite}
                                        isFavorite={favoriteBooks.includes(book.id)}
                                        userLoggedIn={!!currentUser && currentUser.email !== undefined}
                                    />
                                ))}
                            </div>

                            {/* Deuxième ligne si plus de 4 livres */}
                            {books.length > 4 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {books.slice(4, 8).map((book) => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            viewMode="grid"
                                            onToggleFavorite={handleToggleBookFavorite}
                                            isFavorite={favoriteBooks.includes(book.id)}
                                            userLoggedIn={!!currentUser && currentUser.email !== undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun livre trouvé</h3>
                            <p className="text-gray-600">Les livres seront affichés ici une fois ajoutés à la collection.</p>
                        </div>
                    )}
                </div>

                {/* Separator */}
                <div className="flex items-center justify-center mb-20">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full max-w-md"></div>
                    <div
                        className="mx-6 w-3 h-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                    ></div>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full max-w-md"></div>
                </div>

                {/* Theses Section */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                                style={{ backgroundColor: `${secondaryColor}15` }}
                            >
                                <GraduationCap className="w-6 h-6" style={{ color: secondaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                                    Mémoires & Thèses
                                </h3>
                                <p className="text-gray-600">
                                    {theses.length > 0 ? `${theses.length} mémoire${theses.length > 1 ? 's' : ''} disponible${theses.length > 1 ? 's' : ''}` : 'Travaux de recherche et mémoires académiques'}
                                </p>
                            </div>
                        </div>

                        <a
                            href="/thesis"
                            className="flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                            style={{
                                backgroundColor: `${secondaryColor}10`,
                                color: secondaryColor
                            }}
                        >
                            Voir tous les mémoires
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                    </div>

                    {theses.length > 0 ? (
                        <>
                            {/* Grille principale avec ThesisCard */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                {theses.slice(0, 4).map((thesis) => (
                                    <ThesisCard
                                        key={thesis.id}
                                        thesis={thesis}
                                        viewMode="grid"
                                        onView={handleThesisView}
                                        onToggleFavorite={handleToggleThesisFavorite}
                                        isFavorite={favoriteTheses.includes(thesis.id)}
                                    />
                                ))}
                            </div>

                            {/* Deuxième ligne si plus de 4 mémoires */}
                            {theses.length > 4 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {theses.slice(4, 8).map((thesis) => (
                                        <ThesisCard
                                            key={thesis.id}
                                            thesis={thesis}
                                            viewMode="grid"
                                            onView={handleThesisView}
                                            onToggleFavorite={handleToggleThesisFavorite}
                                            isFavorite={favoriteTheses.includes(thesis.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun mémoire trouvé</h3>
                            <p className="text-gray-600">Les mémoires seront affichés ici une fois ajoutés à la collection.</p>
                        </div>
                    )}
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <div
                        className="inline-block p-8 rounded-2xl shadow-xl"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`
                        }}
                    >
                        <h3 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                            Besoin d'aide pour trouver une ressource ?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Notre équipe est là pour vous accompagner dans vos recherches académiques.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/dashboard/messages"
                                className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Contacter un bibliothécaire
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResourcesSection;