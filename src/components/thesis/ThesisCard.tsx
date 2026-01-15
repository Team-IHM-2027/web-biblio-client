import React, { useState, useEffect } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import {
    Heart,
    GraduationCap,
    User,
    Calendar,
    ExternalLink,
    Star,
    BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BiblioThesis } from '../../types/thesis';
import { doc, writeBatch, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { BiblioUser, TabEtatEntry, EtatValue, ReservationEtatValue } from '../../types/auth';
import { authService } from '../../services/auth/authService';

export type ViewMode = 'grid' | 'list';

interface ThesisCardProps {
    thesis: BiblioThesis;
    viewMode?: ViewMode;
    onView?: (thesisId: string) => void;
    onToggleFavorite?: (thesisId: string) => void;
    isFavorite?: boolean;
    isLoading?: boolean;
    className?: string;
    userLoggedIn?: boolean;
}

// Fonction helper pour vérifier si une clé est valide pour BiblioUser
const isKeyOfBiblioUser = (key: string, max: number): key is keyof BiblioUser => {
    const match = key.match(/^etat(\d+)$/);
    if (!match) return false;
    const num = parseInt(match[1]);
    return num >= 1 && num <= max;
};

const ThesisCard: React.FC<ThesisCardProps> = ({
                                                   thesis,
                                                   viewMode = 'grid',
                                                   onToggleFavorite,
                                                   isFavorite = false,
                                                   className = ""
                                               }) => {
    const { orgSettings } = useConfig();
    const [imageError, setImageError] = useState(false);
    const [isReserving, setIsReserving] = useState(false);
    const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    // Vérifier l'authentification au montage et lors des changements
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await authService.getCurrentUser();
                setCurrentUser(user);
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Erreur vérification auth:', error);
                setCurrentUser(null);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    // Gérer la réservation
    const handleReserve = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated || !currentUser) {
            alert("Vous devez être connecté pour réserver un mémoire.");
            return;
        }

        setIsReserving(true);

        try {
            const userRef = doc(db, "BiblioUser", currentUser.email!);
            const batch = writeBatch(db);
            const max = orgSettings?.MaximumSimultaneousLoans || 5;

            // Trouver le premier slot etat disponible
            let etatIndex: number | null = null;
            for (let i = 1; i <= max; i++) {
                const etatKey = `etat${i}`;
                if (isKeyOfBiblioUser(etatKey, max) && currentUser[etatKey as keyof BiblioUser] === 'ras') {
                    etatIndex = i;
                    break;
                }
            }

            if (etatIndex === null) {
                alert("Vous avez atteint le nombre maximum de réservations.");
                return;
            }

            const dateReservation = Timestamp.now();
            const tabEtatEntry: TabEtatEntry = [
                thesis.id,
                thesis.name,
                thesis.département, // Utiliser le département comme cathegorie
                thesis.image,
                "BiblioThesis", // Nom de la collection
                dateReservation,
                1
            ];

            // Mettre à jour l'état de réservation de l'utilisateur
            batch.update(userRef, {
                [`etat${etatIndex}`]: 'reserv' as EtatValue,
                [`tabEtat${etatIndex}`]: tabEtatEntry,
                reservations: arrayUnion({
                    cathegorie: thesis.département, // Département au lieu de cathegorie
                    dateReservation,
                    etat: 'reserver' as ReservationEtatValue,
                    exemplaire: 1,
                    image: thesis.image,
                    name: thesis.name,
                    nomBD: "BiblioThesis"
                })
            });

            // Pour les mémoires, pas besoin de décrémenter les exemplaires
            // car ils sont généralement consultables par plusieurs personnes

            await batch.commit();
            alert("Mémoire réservé avec succès!");

        } catch (error) {
            console.error('Erreur lors de la réservation:', error);
            alert("Une erreur est survenue lors de la réservation.");
        } finally {
            setIsReserving(false);
        }
    };

    // Gérer les favoris
    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onToggleFavorite) {
            onToggleFavorite(thesis.id);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    // Calculer la note moyenne
    const averageRating = thesis.commentaire.length > 0
        ? thesis.commentaire.reduce((sum, comment) => sum + comment.note, 0) / thesis.commentaire.length
        : 0;

    // Traiter les mots-clés
    const keywords = thesis.keywords
        ? thesis.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0).slice(0, 3)
        : [];

    if (viewMode === 'grid') {
        return (
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
                {/* Image with Link and Actions */}
                <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Link to={`/thesis/${thesis.id}`} className="block group w-full h-full">
                        {thesis.image && !imageError ? (
                            <img
                                src={thesis.image}
                                alt={thesis.theme || `Mémoire ${thesis.matricule}`}
                                className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-110"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <GraduationCap
                                    size={48}
                                    className="text-gray-300 transition-all duration-300 group-hover:text-gray-400"
                                />
                            </div>
                        )}
                    </Link>

                    {/* Overlay with actions - OUTSIDE the Link */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {/* Badge département */}
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {thesis.département}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Bouton favoris */}
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                            isFavorite
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-red-500'
                                        }`}
                                    >
                                        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                                    </button>

                                    {/* Lien PDF si disponible - NOW OUTSIDE Link */}
                                    {thesis.pdfUrl && (
                                        <a
                                            href={thesis.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-blue-500 transition-all duration-200"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                    <Link to={`/thesis/${thesis.id}`} className="block group">
                        {/* Titre */}
                        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                            {thesis.theme || thesis.name}
                        </h3>

                        {/* Informations de base */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <User size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{thesis.name}</span>
                            </div>

                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                <span>{thesis.annee}</span>
                            </div>

                            {thesis.superviseur && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <GraduationCap size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">Sup: {thesis.superviseur}</span>
                                </div>
                            )}
                        </div>

                        {/* Abstract */}
                        {thesis.abstract && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                                {thesis.abstract}
                            </p>
                        )}

                        {/* Mots-clés */}
                        {keywords.length > 0 && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                    {keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Note moyenne */}
                        {averageRating > 0 && (
                            <div className="flex items-center mb-4">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={`${
                                                star <= Math.round(averageRating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Link>

                    {/* Action buttons - OUTSIDE both Links */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleReserve}
                            disabled={isReserving}
                            className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {isReserving ? 'Réservation...' : 'Réserver'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Mode liste
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
            <div className="flex flex-col sm:flex-row">
                <Link to={`/thesis/${thesis.id}`} className="block group">
                    <div className="relative w-full sm:w-40 h-32 sm:h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                        {thesis.image && !imageError ? (
                            <img
                                src={thesis.image}
                                alt={thesis.theme || `Mémoire ${thesis.matricule}`}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <GraduationCap size={24} className="text-gray-300" />
                            </div>
                        )}
                    </div>
                </Link>

                {/* Contenu */}
                <div className="flex-1 p-4 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-4">
                            <Link to={`/thesis/${thesis.id}`} className="block group">
                                {/* Titre */}
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {thesis.theme || thesis.name}
                                </h3>

                                {/* Informations de base */}
                                <div className="space-y-1 mb-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <User size={14} className="mr-2 text-gray-400" />
                                        <span>{thesis.name} ({thesis.matricule})</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar size={14} className="mr-1 text-gray-400" />
                                            <span>{thesis.annee}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${primaryColor}15`,
                                                    color: primaryColor
                                                }}
                                            >
                                                {thesis.département}
                                            </span>
                                        </div>
                                    </div>

                                    {thesis.superviseur && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <GraduationCap size={14} className="mr-2 text-gray-400" />
                                            <span className="truncate">Superviseur: {thesis.superviseur}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Abstract */}
                                {thesis.abstract && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                        {thesis.abstract}
                                    </p>
                                )}

                                {/* Mots-clés */}
                                {keywords.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-1">
                                            {keywords.map((keyword, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Note et commentaires */}
                                {averageRating > 0 && (
                                    <div className="flex items-center">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={14}
                                                    className={`${
                                                        star <= Math.round(averageRating)
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-600 ml-2">
                                            ({thesis.commentaire.length})
                                        </span>
                                    </div>
                                )}
                            </Link>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`p-2 rounded-full transition-all duration-200 ${
                                        isFavorite ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
                                    }`}
                                >
                                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                {thesis.pdfUrl && (
                                    <a
                                        href={thesis.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-200"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleReserve}
                                    disabled={isReserving || !isAuthenticated}
                                    className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                                        isAuthenticated
                                            ? `border-2 hover:shadow-lg ${isReserving ? 'opacity-75 cursor-not-allowed' : ''}`
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                    style={{
                                        borderColor: isAuthenticated ? primaryColor : undefined,
                                        color: isAuthenticated ? primaryColor : undefined
                                    }}
                                >
                                    {isReserving ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
                                                 style={{ borderColor: primaryColor }}></div>
                                            Réservation...
                                        </div>
                                    ) : isAuthenticated ? (
                                        <>
                                            <BookOpen size={16} className="mr-2 inline" />
                                            Réserver
                                        </>
                                    ) : (
                                        'Connexion requise'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThesisCard;
