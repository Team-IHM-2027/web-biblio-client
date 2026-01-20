import React, { useState, useRef, useEffect } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { 
    Search, 
    X, 
    Filter,
    User,
    Building,
    Tag,
    Calendar
} from 'lucide-react';

interface SearchFilters {
    query: string;
    author: string;
    publisher: string;
    category: string;
    yearFrom: string;
    yearTo: string;
}

interface AdvancedSearchBarProps {
    onSearchChange: (filters: SearchFilters) => void;
    placeholder?: string;
    className?: string;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
    onSearchChange,
    placeholder = "Rechercher des livres, auteurs, éditeurs...",
    className = ""
}) => {
    const { orgSettings } = useConfig();
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        author: '',
        publisher: '',
        category: '',
        yearFrom: '',
        yearTo: ''
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    //@ts-ignore
    const _secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b'; // Prefix with underscore

    // Déclencher la recherche quand les filtres changent
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearchChange(filters);
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timeoutId);
    }, [filters, onSearchChange]);

    // Gérer les changements de filtres
    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Effacer tous les filtres
    const clearAllFilters = () => {
        setFilters({
            query: '',
            author: '',
            publisher: '',
            category: '',
            yearFrom: '',
            yearTo: ''
        });
        setShowAdvanced(false);
    };

    // Vérifier si des filtres avancés sont actifs
    const hasAdvancedFilters = filters.author || filters.publisher || filters.category || filters.yearFrom || filters.yearTo;

    // Fermer les filtres avancés quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={searchRef} className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
            {/* Barre de recherche principale */}
            <div className={`flex items-center p-4 transition-all duration-200 ${
                isFocused ? 'ring-2 ring-opacity-50' : ''
            }`} style={{ 
                boxShadow: isFocused ? `0 0 0 3px ${primaryColor}50` : 'none' 
            }}>
                <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                
                <input
                    type="text"
                    placeholder={placeholder}
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="flex-1 text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
                />

                {/* Boutons d'action */}
                <div className="flex items-center gap-2 ml-3">
                    {(filters.query || hasAdvancedFilters) && (
                        <button
                            onClick={clearAllFilters}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="Effacer la recherche"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}

                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                            showAdvanced || hasAdvancedFilters
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={{
                            backgroundColor: (showAdvanced || hasAdvancedFilters) ? primaryColor : 'transparent'
                        }}
                        title="Filtres avancés"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filtres avancés */}
            {showAdvanced && (
                <div className="border-t border-gray-100 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Auteur */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                <User className="w-3 h-3 inline mr-1" />
                                Auteur
                            </label>
                            <input
                                type="text"
                                placeholder="Nom de l'auteur"
                                value={filters.author}
                                onChange={(e) => handleFilterChange('author', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                style={{ 
                                    boxShadow: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Éditeur */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                <Building className="w-3 h-3 inline mr-1" />
                                Éditeur
                            </label>
                            <input
                                type="text"
                                placeholder="Maison d'édition"
                                value={filters.publisher}
                                onChange={(e) => handleFilterChange('publisher', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                style={{ 
                                    boxShadow: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Catégorie */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                <Tag className="w-3 h-3 inline mr-1" />
                                Catégorie
                            </label>
                            <input
                                type="text"
                                placeholder="Genre ou domaine"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                style={{ 
                                    boxShadow: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Année de publication */}
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Année de publication
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="De"
                                    value={filters.yearFrom}
                                    onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                    style={{ 
                                        boxShadow: 'none',
                                        outline: 'none'
                                    }}
                                    min="1800"
                                    max={new Date().getFullYear()}
                                />
                                <span className="text-gray-400 self-center">à</span>
                                <input
                                    type="number"
                                    placeholder="À"
                                    value={filters.yearTo}
                                    onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                    style={{ 
                                        boxShadow: 'none',
                                        outline: 'none'
                                    }}
                                    min="1800"
                                    max={new Date().getFullYear()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions des filtres avancés */}
                    {hasAdvancedFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Filtres actifs : {[filters.author, filters.publisher, filters.category, filters.yearFrom, filters.yearTo].filter(Boolean).length}
                                </span>
                                
                                <button
                                    onClick={() => {
                                        setFilters(prev => ({
                                            ...prev,
                                            author: '',
                                            publisher: '',
                                            category: '',
                                            yearFrom: '',
                                            yearTo: ''
                                        }));
                                    }}
                                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Effacer les filtres avancés
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Suggestions de recherche rapide */}
            {isFocused && !filters.query && (
                <div className="border-t border-gray-100 p-4">
                    <div className="text-xs font-medium text-gray-600 mb-3">Recherches populaires :</div>
                    <div className="flex flex-wrap gap-2">
                        {['Informatique', 'Mathématiques', 'Physique', 'Littérature', 'Histoire'].map((term) => (
                            <button
                                key={term}
                                onClick={() => handleFilterChange('query', term)}
                                className="px-3 py-1 text-xs rounded-full border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedSearchBar;