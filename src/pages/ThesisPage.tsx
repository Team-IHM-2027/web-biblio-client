import React, { useState, useCallback } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { Link } from 'react-router-dom';
import DepartmentFilter from '../components/common/DepartmentFilter.tsx';
import ThesisAdvancedSearchBar from '../components/thesis/ThesisAdvancedSearchBar';
import ThesisSortOptions, { ThesisSortOption, ViewMode } from '../components/thesis/ThesisSortOptions';
import ThesisList from '../components/thesis/ThesisList';
import ThesisStatistics from '../components/thesis/ThesisStatistics';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FileText, Award, TrendingUp } from 'lucide-react';
import { ThesisSearchFilters } from '../types/thesis';

const ThesisPage: React.FC = () => {
    const { orgSettings } = useConfig();

    const [searchFilters, setSearchFilters] = useState<ThesisSearchFilters>({
        query: '',
        author: '',
        department: '',
        year: '',
        keywords: '',
        supervisor: ''
    });

    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<ThesisSortOption>('year-desc');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [favoriteTheses, setFavoriteTheses] = useState<string[]>([]);

    // Configuration des couleurs
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    // Handlers pour les composants
    const handleSearchChange = useCallback((filters: ThesisSearchFilters) => {
        setSearchFilters(filters);
    }, []);

    const handleDepartmentChange = useCallback((departments: string[]) => {
        setSelectedDepartments(departments);
    }, []);

    const handleSortChange = useCallback((sort: ThesisSortOption) => {
        setSortOption(sort);
    }, []);

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
    }, []);

    const handleThesisView = useCallback(async (thesisId: string) => {
        try {
            console.log('📖 Consultation du mémoire:', thesisId);
            // TODO: Implémenter la logique de consultation avec votre service
            // await thesisService.viewThesis(thesisId);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch {
            alert('Erreur lors de la consultation. Veuillez réessayer.');
        }
    }, []);

    // Gestion des favoris
    const handleToggleFavorite = useCallback((thesisId: string) => {
        setFavoriteTheses(prev => {
            const newFavorites = prev.includes(thesisId)
                ? prev.filter(id => id !== thesisId)
                : [...prev, thesisId];

            return newFavorites;
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* En-tête avec hero section */}
            <div className="bg-[#1b263b] border border-gray-200 shadow-sm">
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
                            Mémoires & Thèses {organizationName}
                        </h1>
                        <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed">
                            Découvrez les travaux de recherche de nos étudiants et diplômés.
                            Explorez, consultez et trouvez l'inspiration pour vos propres projets académiques.
                        </p>
                    </div>

                    {/* Barre de recherche avancée */}
                    <div className="max-w-4xl mx-auto">
                        <ThesisAdvancedSearchBar
                            onSearchChange={handleSearchChange}
                            placeholder="Rechercher par auteur, département, mots-clés ou superviseur..."
                        />
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Sidebar avec filtres */}
                    <aside className="xl:col-span-1 space-y-6">
                        {/* Filtre par département */}
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
                                    <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                                <h3 className="font-semibold text-gray-800">Guide de recherche</h3>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-3">
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Utilisez des <strong>mots-clés spécialisés</strong> pour cibler votre domaine</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Filtrez par <strong>département</strong> pour explorer votre filière</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 mr-3 flex-shrink-0" />
                                    <span>Consultez les <strong>travaux récents</strong> pour les dernières recherches</span>
                                </li>
                            </ul>
                        </div>

                        {/* Conseils académiques */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                            <div className="flex items-center mb-4">
                                <Award className="w-6 h-6 mr-3" style={{ color: primaryColor }} />
                                <h3 className="font-semibold text-gray-800">Conseils académiques</h3>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-start">
                                    <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                    <span>Explorez les mémoires de votre département pour comprendre les standards</span>
                                </div>
                                <div className="flex items-start">
                                    <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span>Analysez les méthodologies utilisées dans les travaux similaires</span>
                                </div>
                                <div className="flex items-start">
                                    <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                                    <span>Identifiez les gaps de recherche pour vos futurs projets</span>
                                </div>
                            </div>
                        </div>

                        <ThesisStatistics
                            className="mb-8"
                            showRefreshButton={false}
                            compact={true}
                        />

                    </aside>

                    {/* Contenu principal */}
                    <main className="xl:col-span-3 space-y-6">
                        {/* Options de tri et d'affichage */}
                        <ThesisSortOptions
                            currentSort={sortOption}
                            onSortChange={handleSortChange}
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                        />

                        {/* Liste des mémoires */}
                        <ThesisList
                            searchFilters={searchFilters}
                            selectedDepartments={selectedDepartments}
                            sortOption={sortOption}
                            viewMode={viewMode}
                            onThesisView={handleThesisView}
                            onToggleFavorite={handleToggleFavorite}
                            favoriteTheses={favoriteTheses}
                        />
                    </main>
                </div>
            </div>

            {/* Section d'aide */}
            <div className="bg-white border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            Besoin d'aide pour votre recherche académique ?
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            Notre équipe académique est là pour vous accompagner dans vos recherches
                            et vous guider vers les ressources les plus pertinentes pour vos travaux.
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

export default ThesisPage;
