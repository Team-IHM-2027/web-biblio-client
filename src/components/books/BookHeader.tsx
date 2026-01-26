import React, { useState } from 'react';

import { useConfig } from '../../contexts/ConfigContext';
import { BiblioBook, CommentWithUserData } from './BookCard';
import {
    Heart,
    Share2,
    Star,
    CheckCircle,
    AlertCircle,
    ShoppingCart,
    Building,
    Package,
    Calendar,
    User,
    MessageSquare
} from 'lucide-react';

interface BookHeaderProps {
    book: BiblioBook;
    onReserve: () => void;
    onToggleFavorite: () => void;
    onOpenCommentModal: () => void;
    isFavorite: boolean;
    isReserved?: boolean;
    isAuthenticated: boolean;
    isReserving: boolean;
    commentsWithUserData?: CommentWithUserData[];
}

const BookHeader: React.FC<BookHeaderProps> = ({
    book,
    onReserve,
    onToggleFavorite,
    onOpenCommentModal,
    isFavorite,
    isReserved = false,
    isAuthenticated,
    isReserving,
    commentsWithUserData = []
}) => {
    const { orgSettings } = useConfig();
    const [_imageError, setImageError] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    const isAvailable = book.exemplaire > 0;
    const availabilityPercentage = (book.exemplaire / book.initialExemplaire) * 100;

    const getAvailabilityColor = () => {
        if (availabilityPercentage > 50) return '#10b981';
        if (availabilityPercentage > 20) return '#f59e0b';
        return '#ef4444';
    };

    // Calcul de la note moyenne depuis commentsWithUserData (utilise field 'note' depuis Comment)
    const averageRating = commentsWithUserData.length > 0
        ? commentsWithUserData.reduce((sum, comment) => sum + comment.note, 0) / commentsWithUserData.length
        : 0;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: book.name,
                    text: `Découvrez "${book.name}" par ${book.auteur}`,
                    url: window.location.href,
                });
            } catch {
                console.log('Partage annulé');
            }
        } else {
            setShowShareMenu(!showShareMenu);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareMenu(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-8">
                {/* Image du livre */}
                <div className="lg:col-span-1">
                    <div className="relative group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                            <img
                                src={book.image || '/default-cover.jpeg'}
                                alt={`Couverture de ${book.name}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    setImageError(true);
                                    e.currentTarget.src = '/default-cover.jpeg';
                                }}
                            />
                        </div>

                        {/* Badge de disponibilité flottant */}
                        <div className="absolute top-4 left-4 z-10">
                            <div className={`px-3 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg backdrop-blur-sm ${isAvailable
                                ? 'bg-green-100/90 text-green-700 border border-green-200'
                                : 'bg-red-100/90 text-red-700 border border-red-200'
                                }`}>
                                {isAvailable ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {book.exemplaire} disponible{book.exemplaire > 1 ? 's' : ''}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Épuisé
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informations du livre */}
                <div className="lg:col-span-2">
                    <div className="h-full flex flex-col">
                        {/* En-tête avec titre et actions */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                            <div className="flex-1 mb-4 lg:mb-0 lg:pr-6">
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                                    {book.name}
                                </h1>

                                <div className="flex items-center text-lg text-gray-600 mb-4">
                                    <User className="w-5 h-5 mr-2" />
                                    <span className="font-medium">{book.auteur}</span>
                                </div>

                                {/* Évaluation basée sur commentsWithUserData */}
                                {commentsWithUserData.length > 0 && (
                                    <div className="flex items-center mb-4">
                                        <div className="flex items-center mr-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-5 h-5 transition-colors duration-200 ${star <= Math.round(averageRating)
                                                        ? 'fill-current text-yellow-400'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                            <span className="text-sm text-gray-600 font-medium">
                                                {averageRating.toFixed(1)} sur 5
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                ({commentsWithUserData.length} avis)
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Pas d'avis encore */}
                                {commentsWithUserData.length === 0 && book.commentaire.length === 0 && (
                                    <div className="flex items-center mb-4">
                                        <div className="flex items-center mr-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className="w-5 h-5 text-gray-300"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            Aucun avis pour le moment
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions rapides */}
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onToggleFavorite}
                                    disabled={!isAuthenticated}
                                    className={`p-3 rounded-full transition-all duration-200 ${isFavorite
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={
                                        !isAuthenticated
                                            ? 'Connectez-vous pour ajouter aux favoris'
                                            : isFavorite
                                                ? 'Retirer des favoris'
                                                : 'Ajouter aux favoris'
                                    }
                                >
                                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={handleShare}
                                        className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                                        title="Partager ce livre"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>

                                    {showShareMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                                            <div className="p-2">
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="w-full px-4 py-3 text-left cursor-pointer text-sm hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    Copier le lien
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        window.open(`https://twitter.com/intent/tweet?text=Découvrez "${book.name}" par ${book.auteur}&url=${window.location.href}`, '_blank');
                                                        setShowShareMenu(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left cursor-pointer text-sm hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    🐦 Partager sur Twitter
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
                                                        setShowShareMenu(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left cursor-pointer text-sm hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    Partager sur Facebook
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Informations détaillées */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center">
                                <Package className="w-5 h-5 mr-3 text-gray-400" />
                                <div>
                                    <span className="text-sm text-gray-500">Département</span>
                                    <p className="font-medium">{book.cathegorie}</p>
                                </div>
                            </div>

                            {book.edition && (
                                <div className="flex items-center">
                                    <Building className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Éditeur</span>
                                        <p className="font-medium">{book.edition}</p>
                                    </div>
                                </div>
                            )}

                            {book.etagere && (
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Étagère</span>
                                        <p className="font-medium">{book.etagere}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center">
                                <MessageSquare className="w-5 h-5 mr-3 text-gray-400" />
                                <div>
                                    <span className="text-sm text-gray-500">Commentaires</span>
                                    <p className="font-medium">
                                        {book.commentaire?.length || 0} avis
                                        {commentsWithUserData.length > 0 && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                (Note moyenne: {averageRating.toFixed(1)}/5)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Barre de disponibilité */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Disponibilité</span>
                                <span className="text-sm text-gray-500">
                                    {book.exemplaire}/{book.initialExemplaire} exemplaires
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${Math.max(availabilityPercentage, 5)}%`, // Minimum 5% pour la visibilité
                                        backgroundColor: getAvailabilityColor()
                                    }}
                                />
                            </div>
                            {availabilityPercentage <= 20 && availabilityPercentage > 0 && (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ⚠️ Stock faible - Plus que {book.exemplaire} exemplaire{book.exemplaire > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Actions principales */}
                        <div className="mt-auto">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={onReserve}
                                    disabled={!isReserved && (!isAvailable || isReserving || !isAuthenticated)}
                                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center ${(isAvailable || isReserved) && !isReserving && isAuthenticated
                                        ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    style={{
                                        backgroundColor: (isAvailable || isReserved) && !isReserving && isAuthenticated ? primaryColor : undefined
                                    }}
                                >
                                    {isReserving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                            Réservation en cours...
                                        </>
                                    ) : isReserved ? (
                                        <>
                                            <ShoppingCart className="w-5 h-5 mr-3" />
                                            Voir ma réservation
                                        </>
                                    ) : !isAuthenticated ? (
                                        <>
                                            <ShoppingCart className="w-5 h-5 mr-3" />
                                            Connectez-vous pour réserver
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-5 h-5 mr-3" />
                                            {isAvailable ? 'Réserver ce livre' : 'Livre épuisé'}
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={onOpenCommentModal}
                                    disabled={!isAuthenticated}
                                    className={`sm:w-auto px-6 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-200 hover:shadow-lg ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    style={{
                                        borderColor: primaryColor,
                                        color: isAuthenticated ? primaryColor : '#9ca3af',
                                        backgroundColor: `${primaryColor}08`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isAuthenticated) {
                                            e.currentTarget.style.backgroundColor = primaryColor;
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isAuthenticated) {
                                            e.currentTarget.style.backgroundColor = `${primaryColor}08`;
                                            e.currentTarget.style.color = primaryColor;
                                        }
                                    }}
                                    title={!isAuthenticated ? 'Connectez-vous pour donner votre avis' : 'Donner votre avis sur ce livre'}
                                >
                                    <MessageSquare className="w-5 h-5 mr-2 inline" />
                                    {!isAuthenticated ? 'Se connecter pour commenter' : 'Donner mon avis'}
                                </button>
                            </div>

                            {!isAuthenticated && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-700 text-center flex items-center justify-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        <span>
                                            <button
                                                onClick={() => window.location.href = '/auth'}
                                                className="font-medium underline hover:no-underline"
                                            >
                                                Connectez-vous
                                            </button>
                                            {' '}pour réserver ce livre et laisser un avis
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookHeader;
