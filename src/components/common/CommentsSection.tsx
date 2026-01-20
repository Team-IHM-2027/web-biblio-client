import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { CommentWithUserData } from '../books/BookCard';
import { Timestamp } from 'firebase/firestore';
import {
    MessageSquare,
    Star,
    Calendar,
    User,
    ThumbsUp,
    MoreHorizontal,
    Filter
} from 'lucide-react';

interface CommentsSectionProps {
    comments: CommentWithUserData[];
    onOpenCommentModal: () => void;
    onHelpfulClick?: (commentId: string) => void;
    isAuthenticated: boolean;
}

type SortOption = 'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'helpful';
type FilterOption = 'all' | '5stars' | '4stars' | '3stars' | '2stars' | '1star';

const CommentsSection: React.FC<CommentsSectionProps> = ({
    comments,
    onOpenCommentModal,
    onHelpfulClick,
    isAuthenticated
}) => {
    const { orgSettings } = useConfig();
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [showFilters, setShowFilters] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';

    // Calculer les statistiques des évaluations (utilise field 'note')
    const ratingStats = {
        average: comments.length > 0
            ? comments.reduce((sum, comment) => sum + comment.note, 0) / comments.length
            : 0,
        distribution: [5, 4, 3, 2, 1].map(rating =>
            comments.filter(comment => comment.note === rating).length
        )
    };

    // Filtrer et trier les commentaires
    const getFilteredAndSortedComments = () => {
        let filtered = [...comments];

        // Appliquer le filtre
        if (filterBy !== 'all') {
            const targetRating = parseInt(filterBy.charAt(0));
            filtered = filtered.filter(comment => comment.note === targetRating);
        }

        // Appliquer le tri avec Timestamp
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return a.heure.toMillis() - b.heure.toMillis();
                case 'rating-high':
                    return b.note - a.note;
                case 'rating-low':
                    return a.note - b.note;
                case 'helpful':
                    return (b.helpful || 0) - (a.helpful || 0);
                default: // newest
                    return b.heure.toMillis() - a.heure.toMillis();
            }
        });

        return filtered;
    };

    const filteredComments = getFilteredAndSortedComments();

    // Formatage de date avec Timestamp
    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
        if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
        if (diffInDays === 0) return 'Aujourd\'hui';
        if (diffInDays === 1) return 'Hier';
        if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
        if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
        if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRatingPercentage = (starCount: number) => {
        return comments.length > 0 ? (ratingStats.distribution[5 - starCount] / comments.length) * 100 : 0;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
            {/* En-tête */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                <div className="flex items-center mb-4 lg:mb-0">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                        style={{ backgroundColor: `${primaryColor}15` }}
                    >
                        <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                            Avis des lecteurs
                        </h2>
                        <p className="text-gray-600">
                            {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistiques des évaluations */}
            {comments.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Note moyenne */}
                        <div className="text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start mb-4">
                                <span className="text-4xl font-bold mr-4" style={{ color: primaryColor }}>
                                    {ratingStats.average.toFixed(1)}
                                </span>
                                <div>
                                    <div className="flex items-center mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${star <= ratingStats.average
                                                        ? 'fill-current text-yellow-400'
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Basé sur {comments.length} avis
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Distribution des notes */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating, index) => (
                                <div key={rating} className="flex items-center">
                                    <span className="text-sm text-gray-600 w-8">{rating}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${getRatingPercentage(rating)}%`,
                                                backgroundColor: primaryColor
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-8">
                                        {ratingStats.distribution[index]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres et tri */}
            {comments.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filtrer
                            </button>

                            {showFilters && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                                    <div className="p-2">
                                        {[
                                            { value: 'all', label: 'Tous les avis' },
                                            { value: '5stars', label: '5 étoiles' },
                                            { value: '4stars', label: '4 étoiles' },
                                            { value: '3stars', label: '3 étoiles' },
                                            { value: '2stars', label: '2 étoiles' },
                                            { value: '1star', label: '1 étoile' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setFilterBy(option.value as FilterOption);
                                                    setShowFilters(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${filterBy === option.value ? 'bg-gray-100 font-medium' : ''
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Plus récents</option>
                            <option value="oldest">Plus anciens</option>
                            <option value="rating-high">Note décroissante</option>
                            <option value="rating-low">Note croissante</option>
                            <option value="helpful">Plus utiles</option>
                        </select>
                    </div>

                    <span className="text-sm text-gray-600">
                        {filteredComments.length} avis affiché{filteredComments.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Liste des commentaires */}
            <div className="space-y-6">
                {filteredComments.length > 0 ? (
                    filteredComments.map((comment) => (
                        <div key={comment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            {/* En-tête du commentaire */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    {comment.userAvatar ? (
                                        <img
                                            src={comment.userAvatar}
                                            alt={comment.userName || comment.nomUser}
                                            className="w-10 h-10 rounded-full object-cover mr-3"
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                            style={{ backgroundColor: `${primaryColor}15` }}
                                        >
                                            <User className="w-5 h-5" style={{ color: primaryColor }} />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {comment.userName || comment.nomUser || 'Lecteur anonyme'}
                                        </h4>
                                        <div className="flex items-center mt-1">
                                            <div className="flex items-center mr-3">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= comment.note
                                                                ? 'fill-current text-yellow-400'
                                                                : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500 flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {formatDate(comment.heure)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Contenu du commentaire */}
                            <p className="text-gray-700 leading-relaxed mb-4">
                                {comment.texte}
                            </p>

                            {/* Actions du commentaire */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => onHelpfulClick?.(comment.id)}
                                    disabled={!isAuthenticated}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Utile ({comment.helpful || 0})
                                </button>

                                {!isAuthenticated && (
                                    <span className="text-xs text-gray-400">
                                        Connectez-vous pour interagir
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        {comments.length === 0 ? (
                            <div>
                                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    Aucun avis pour le moment
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    Soyez le premier à partager votre opinion sur ce livre !
                                </p>
                                <button
                                    onClick={onOpenCommentModal}
                                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Écrire le premier avis
                                </button>
                            </div>
                        ) : (
                            <div>
                                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    Aucun avis ne correspond aux filtres
                                </h3>
                                <p className="text-gray-500">
                                    Essayez de modifier vos critères de filtrage
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;
