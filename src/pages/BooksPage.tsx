import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { useConfig } from '../contexts/ConfigContext';
import { reservationService } from '../services/reservationService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import DepartmentFilter from '../components/common/DepartmentFilter.tsx';
import AdvancedSearchBar from '../components/books/AdvancedSearchBar';
import BooksSortOptions, { SortOption, ViewMode } from '../components/books/BooksSortOptions';

import BooksList from '../components/books/BooksList';
import Header from "../components/layout/Header.tsx";
import Footer from "../components/layout/Footer.tsx";
//import { MessageCircle } from "lucide-react";
import { Link } from 'react-router-dom';
import LibraryStatistics from "../components/books/LibraryStatistics.tsx";

interface SearchFilters {
    query: string;
    author: string;
    publisher: string;
    category: string;
    yearFrom: string;
    yearTo: string;
}

const BooksPage: React.FC = () => {
    const { orgSettings } = useConfig();
    const { currentUser } = useAuth(); // Moved up for better organization

    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        query: '',
        author: '',
        publisher: '',
        category: '',
        yearFrom: '',
        yearTo: ''
    });

    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<SortOption>('title-asc');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);

    // Configuration des couleurs
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    // Handlers pour les composants existants
    const handleSearchChange = useCallback((filters: SearchFilters) => {
        setSearchFilters(filters);
    }, []);

    const handleDepartmentChange = useCallback((departments: string[]) => {
        setSelectedDepartments(departments);
    }, []);

    const handleSortChange = useCallback((sort: SortOption) => {
        setSortOption(sort);
    }, []);

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
    }, []);


    // Gestion des favoris
    const handleToggleFavorite = useCallback((bookId: string) => {
        setFavoriteBooks(prev => {
            const newFavorites = prev.includes(bookId)
                ? prev.filter(id => id !== bookId)
                : [...prev, bookId];

            return newFavorites;
        });
    }, []);

    // Écouter les notifications de réservation
    useEffect(() => {
        if (currentUser?.id) { // Check if currentUser has id
            const unsubscribe = notificationService.subscribeToUserNotifications(
                currentUser.id,
                (notifications) => {
                    notifications.forEach(notification => {
                        if (!notification.read && notification.type === 'reservation_update') {
                            // Afficher l'alerte
                            if (notification.data?.status === 'approved') {
                                alert(`🎉 ${notification.title}\n${notification.message}`);
                            } else {
                                alert(`❌ ${notification.title}\n${notification.message}`);
                            }

                            // Marquer comme lue
                            notificationService.markAsRead(notification.id);
                        }
                    });
                }
            );

            return () => unsubscribe();
        }
    }, [currentUser]);

    // REMOVED THE DUPLICATE handleBookReserve FUNCTION
    // KEEP ONLY THIS ONE:
    const handleBookReserve = useCallback(async (bookId: string) => {
        try {
            if (!currentUser) {
                alert('Veuillez vous connecter pour réserver un livre');
                return;
            }

            // Validate user data
            //@ts-ignore
            const userName = currentUser.name || currentUser.username || 'Utilisateur';
            const userEmail = currentUser.email;

            if (!userEmail) {
                alert('Votre profil ne contient pas d\'email. Veuillez mettre à jour votre profil.');
                return;
            }

            const result = await reservationService.reserveBook(bookId, currentUser);

            if (result.success) {
                alert('✅ ' + result.message);

                // Refresh the page or update UI if needed
                // You might want to trigger a refresh of the book list here
            } else {
                alert('❌ ' + result.message);
            }
        } catch (error: any) {
            console.error('Reservation error:', error);
            alert('❌ Erreur lors de la réservation. Veuillez réessayer.');
        }
    }, [currentUser]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* En-tête avec hero section */}
            <div className="border bg-[#1b263b] border-gray-200 shadow-sm"
            >
                <div className="container mx-auto px-4 py-12">
                    {/* Titre principal */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4 mt-12">
                            <div
                                className="w-16 h-1 rounded-full"
                                style={{
                                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                                }}
                            />
                        </div>
                        <h1
                            className="text-4xl md:text-5xl font-bold mb-4"
                            style={{ color: primaryColor }}
                        >
                            Livres {organizationName}
                        </h1>
                        <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed">
                            Explorez notre collection complète de livres, mémoires et ressources académiques.
                            Recherchez, filtrez et découvrez les ouvrages qui enrichiront vos connaissances.
                        </p>
                    </div>

                    {/* Barre de recherche avancée - VOTRE COMPOSANT */}
                    <div className="max-w-4xl mx-auto">
                        <AdvancedSearchBar
                            onSearchChange={handleSearchChange}
                            placeholder="Rechercher par titre, auteur, éditeur ou mot-clé..."
                        />
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Sidebar avec filtres */}
                    <aside className="xl:col-span-1 space-y-6">
                        {/* Filtre par département - VOTRE COMPOSANT CORRIGÉ */}
                        <DepartmentFilter
                            selectedDepartments={selectedDepartments}
                            onDepartmentChange={handleDepartmentChange}
                        />

                        {/* Informations utiles */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center mb-4">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                    style={{ backgroundColor: `${primaryColor}15` }}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        style={{ color: primaryColor }}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-800">Conseils de recherche</h3>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-3">
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Utilisez des <strong>mots-clés précis</strong> pour des résultats pertinents</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Combinez <strong>plusieurs filtres</strong> pour affiner votre recherche</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Explorez les <strong>départements</strong> pour découvrir de nouveaux domaines</span>
                                </li>
                            </ul>
                        </div>

                        <LibraryStatistics
                            className="mb-8"
                            showRefreshButton={true}
                            compact={true}
                        />
                    </aside>

                    {/* Contenu principal */}
                    <main className="xl:col-span-3 space-y-6">
                        {/* Options de tri et d'affichage - VOTRE COMPOSANT */}
                        <BooksSortOptions
                            currentSort={sortOption}
                            onSortChange={handleSortChange}
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                        />

                        {/* Liste des livres - NOUVEAU COMPOSANT avec son propre loading */}
                        <BooksList
                            searchFilters={searchFilters}
                            selectedDepartments={selectedDepartments}
                            sortOption={sortOption}
                            viewMode={viewMode}
                            onBookReserve={handleBookReserve}
                            onToggleFavorite={handleToggleFavorite}
                            favoriteBooks={favoriteBooks}
                        />
                    </main>
                </div>
            </div>

            {/* Section d'aide */}
            <div className="bg-white border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            Besoin d'aide pour votre recherche ?
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            Notre équipe de bibliothécaires est là pour vous accompagner dans vos recherches
                            et vous aider à trouver les ressources les plus adaptées à vos besoins.
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
            <Footer />
        </div>
    );
};

export default BooksPage;