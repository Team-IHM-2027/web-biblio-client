import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { BiblioThesis, ThesisCommentWithUserData } from '../../types/thesis';
import {
    Heart,
    Share2,
    Star,
    Eye,
    Download,
    GraduationCap,
    User,
    Building,
    Package,
    Calendar,
    MessageSquare,
    FileText,
    Tag
} from 'lucide-react';

interface ThesisHeaderProps {
    thesis: BiblioThesis;
    onView: () => void;
    onToggleFavorite: () => void;
    onOpenCommentModal: () => void;
    isFavorite: boolean;
    isAuthenticated: boolean;
    isViewing: boolean;
    commentsWithUserData?: ThesisCommentWithUserData[];
}

const ThesisHeader: React.FC<ThesisHeaderProps> = ({
    thesis,
    onView,
    onToggleFavorite,
    onOpenCommentModal,
    isFavorite,
    isAuthenticated,
    isViewing,
    commentsWithUserData = []
}) => {
    const { orgSettings } = useConfig();
    const [imageError, setImageError] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    // Calcul de la note moyenne
    const averageRating = commentsWithUserData.length > 0
        ? commentsWithUserData.reduce((sum, comment) => sum + comment.note, 0) / commentsWithUserData.length
        : 0;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: thesis.theme || `Mémoire de ${thesis.name}`,
                    text: `Découvrez le mémoire de ${thesis.name} - ${thesis.département}`,
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

    // Traiter les mots-clés
    const keywords = thesis.keywords
        ? thesis.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
        : [];

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 lg:p-8">
                {/* Image du mémoire */}
                <div className="lg:col-span-1">
                    <div className="relative group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadow-lg">
                            <img
                                src={thesis.image || '/default-cover.jpeg'}
                                alt={`Mémoire de ${thesis.name}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    setImageError(true);
                                    e.currentTarget.src = '/default-cover.jpeg';
                                }}
                            />
                        </div>

                        {/* Badge d'année flottant */}
                        <div className="absolute top-4 left-4 z-10">
                            <div className="px-3 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg backdrop-blur-sm bg-blue-100/90 text-blue-700 border border-blue-200">
                                <Calendar className="w-4 h-4 mr-2" />
                                {thesis.annee}
                            </div>
                        </div>

                        {/* Badge d'étagère */}
                        {thesis.etagere && (
                            <div className="absolute bottom-4 right-4 z-10">
                                <div className="px-2 py-1 rounded-full bg-black bg-opacity-60 text-white text-xs font-medium">
                                    Ét: {thesis.etagere}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Informations du mémoire */}
                <div className="lg:col-span-2">
                    <div className="h-full flex flex-col">
                        {/* En-tête avec titre et actions */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                            <div className="flex-1 mb-4 lg:mb-0 lg:pr-6">
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                                    {thesis.theme || `Mémoire ${thesis.matricule}`}
                                </h1>

                                <div className="flex items-center text-lg text-gray-600 mb-4">
                                    <User className="w-5 h-5 mr-2" />
                                    <span className="font-medium">{thesis.name}</span>
                                    <span className="mx-2 text-gray-400">•</span>
                                    <span className="text-gray-500">{thesis.matricule}</span>
                                </div>

                                {/* Évaluation */}
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
                                {commentsWithUserData.length === 0 && thesis.commentaire.length === 0 && (
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
                                    className={`p-3 rounded-full cursor-pointer transition-all duration-200 ${isFavorite
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
                                        className="p-3 rounded-full cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                                        title="Partager ce mémoire"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>

                                    {showShareMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                                            <div className="p-2">
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    Twitter
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank');
                                                        setShowShareMenu(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors rounded-lg"
                                                >
                                                    Facebook
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
                                <Building className="w-5 h-5 mr-3 text-gray-400" />
                                <div>
                                    <span className="text-sm text-gray-500">Département</span>
                                    <p className="font-medium">{thesis.département}</p>
                                </div>
                            </div>

                            {thesis.superviseur && (
                                <div className="flex items-center">
                                    <GraduationCap className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Superviseur</span>
                                        <p className="font-medium">{thesis.superviseur}</p>
                                    </div>
                                </div>
                            )}

                            {thesis.etagere && (
                                <div className="flex items-center">
                                    <Package className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="text-sm text-gray-500">Étagère</span>
                                        <p className="font-medium">{thesis.etagere}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center">
                                <MessageSquare className="w-5 h-5 mr-3 text-gray-400" />
                                <div>
                                    <span className="text-sm text-gray-500">Commentaires</span>
                                    <p className="font-medium">
                                        {thesis.commentaire?.length || 0} avis
                                        {commentsWithUserData.length > 0 && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                (Note moyenne: {averageRating.toFixed(1)}/5)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mots-clés */}
                        {keywords.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center mb-3">
                                    <Tag className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Mots-clés</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 hover:shadow-sm"
                                            style={{
                                                backgroundColor: `${primaryColor}10`,
                                                borderColor: `${primaryColor}30`,
                                                color: primaryColor
                                            }}
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions principales */}
                        <div className="mt-auto">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={onView}
                                    disabled={isViewing || !isAuthenticated}
                                    className={`flex-1 py-4 px-6 cursor-pointer rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center ${!isViewing && isAuthenticated
                                            ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    style={{
                                        backgroundColor: !isViewing && isAuthenticated ? primaryColor : undefined
                                    }}
                                >
                                    {isViewing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                            Consultation en cours...
                                        </>
                                    ) : !isAuthenticated ? (
                                        <>
                                            <Eye className="w-5 h-5 mr-3" />
                                            Connectez-vous pour Reserver
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-5 h-5 mr-3" />
                                            Reserver ce mémoire
                                        </>
                                    )}
                                </button>

                                {thesis.pdfUrl && (
                                    <button
                                        onClick={() => window.open(thesis.pdfUrl, '_blank')}
                                        className="sm:w-auto px-6 py-4 cursor-pointer rounded-xl font-semibold text-lg border-2 transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                                        style={{
                                            borderColor: primaryColor,
                                            color: primaryColor,
                                            backgroundColor: `${primaryColor}08`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = primaryColor;
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = `${primaryColor}08`;
                                            e.currentTarget.style.color = primaryColor;
                                        }}
                                        title="Télécharger le PDF"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        PDF
                                    </button>
                                )}

                                <button
                                    onClick={onOpenCommentModal}
                                    disabled={!isAuthenticated}
                                    className={`sm:w-auto px-6 py-4 cursor-pointer rounded-xl font-semibold text-lg border-2 transition-all duration-200 hover:shadow-lg ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
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
                                    title={!isAuthenticated ? 'Connectez-vous pour donner votre avis' : 'Donner votre avis sur ce mémoire'}
                                >
                                    <MessageSquare className="w-5 h-5 mr-2 inline" />
                                    {!isAuthenticated ? 'Se connecter pour commenter' : 'Donner mon avis'}
                                </button>
                            </div>

                            {!isAuthenticated && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-700 text-center flex items-center justify-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        <span>
                                            <button
                                                onClick={() => window.location.href = '/auth'}
                                                className="font-medium underline hover:no-underline"
                                            >
                                                Connectez-vous
                                            </button>
                                            {' '}pour consulter ce mémoire et laisser un avis
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

export default ThesisHeader;
