import React, { useState, useEffect } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { Heart, ShoppingCart, CheckCircle, AlertCircle, User, Building, Package, Clock, Copy } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Timestamp, doc, arrayUnion, writeBatch, increment } from "firebase/firestore";
import { db, auth } from '../../configs/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../../services/auth/authService';
import { TabEtatEntry, BiblioUser, EtatValue, ReservationEtatValue } from "../../types/auth";

export interface Comment {
    heure: Timestamp;
    nomUser: string;
    note: number;
    texte: string;
}

export interface CommentWithUserData extends Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    helpful?: number;
}

export interface BiblioBook {
    id: string;
    name: string;
    auteur: string;
    cathegorie: string;
    commentaire: Comment[];
    desc: string;
    edition: string;
    etagere: string;
    exemplaire: number;
    image: string;
    initialExemplaire: number;
    imageUrl?: string; // Ajouté pour compatibilité
    category?: string; // Ajouté pour compatibilité
    author?: string; // Ajouté pour compatibilité
    description?: string; // Ajouté pour compatibilité
    title?: string; // Ajouté pour compatibilité
}

interface BookCardProps {
    book: BiblioBook;
    viewMode?: 'grid' | 'list';
    onToggleFavorite?: (bookId: string) => void;
    onReserve?: (bookId: string) => void; // Nouvelle prop
    isFavorite?: boolean;
    isReserved?: boolean; // Nouvelle prop
    availability?: { // Nouvelle prop
        available: boolean;
        count: number;
    };
    userLoggedIn?: boolean; // Nouvelle prop
    isLoading?: boolean;
    className?: string;
    clickToReserve?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
    book,
    viewMode = 'grid',
    onToggleFavorite,
    onReserve,
    clickToReserve = false,
    isFavorite = false,
    isReserved = false,
    availability, // Removed default value
    userLoggedIn = false,
    isLoading = false,
    className = ""
}) => {
    const { orgSettings } = useConfig();
    const [imageError, setImageError] = useState(false);
    console.log('Image error state:', imageError); // Use it to avoid lint
    const [isReserving, setIsReserving] = useState(false);
    const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
    const navigate = useNavigate();
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    const localIsReserved = currentUser && (
        currentUser.tabEtat1?.[0] === book.id ||
        currentUser.tabEtat2?.[0] === book.id ||
        currentUser.tabEtat3?.[0] === book.id ||
        currentUser.tabEtat4?.[0] === book.id ||
        currentUser.tabEtat5?.[0] === book.id
    );

    const effectiveIsReserved = isReserved || localIsReserved;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.emailVerified) {
                try {
                    const biblioUser = await authService.getCurrentUser();
                    setCurrentUser(biblioUser);
                } catch (error) {
                    console.error('Erreur récupération utilisateur:', error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onToggleFavorite) {
            onToggleFavorite(book.id);
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setImageError(true);
        e.currentTarget.src = '/default-cover.jpeg';
    };

    const calculatedAvailability = {
        available: availability?.available ?? (Number(book.exemplaire) > 0),
        count: availability?.count ?? Number(book.exemplaire) ?? 0
    };

    const isAvailable = calculatedAvailability.available;
    const availabilityPercentage = book.initialExemplaire && book.initialExemplaire > 0
        ? (calculatedAvailability.count / Number(book.initialExemplaire)) * 100
        : calculatedAvailability.count > 0 ? 100 : 0;

    const getAvailabilityColor = () => {
        if (availabilityPercentage > 50) return '#10b981';
        if (availabilityPercentage > 20) return '#f59e0b';
        return '#ef4444';
    };

    const getStatusBadge = () => {
        if (effectiveIsReserved) {
            return {
                text: 'En attente',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: <Clock className="w-3 h-3 mr-1" />
            };
        }
        if (!isAvailable) {
            return {
                text: 'Indisponible',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: <AlertCircle className="w-3 h-3 mr-1" />
            };
        }
        return {
            text: `${calculatedAvailability.count} disponible${calculatedAvailability.count > 1 ? 's' : ''}`,
            color: 'bg-green-100 text-green-700 border-green-200',
            icon: <CheckCircle className="w-3 h-3 mr-1" />
        };
    };

    // Fonction de garde de type pour vérifier si une clé est une clé valide de BiblioUser
    function isKeyOfBiblioUser(key: string, max: number): key is keyof BiblioUser {
        return Array.from({ length: max }, (_, i) => `etat${i + 1}`).includes(key);
    }

    const handleReserve = async (_e: React.MouseEvent) => {
        if (effectiveIsReserved) {
            navigate("/dashboard/consultations");
            return;
        }

        // Utiliser la prop onReserve si fournie
        if (onReserve) {
            if (!userLoggedIn) {
                alert("Vous devez être connecté pour réserver un livre.");
                return;
            }

            onReserve(book.id);
            return;
        }

        // Ancienne logique de réservation (pour rétrocompatibilité)
        if (!currentUser || !isAvailable) {
            alert("Vous devez être connecté pour réserver un livre.");
            return;
        }

        setIsReserving(true);

        try {
            const userRef = doc(db, "BiblioUser", currentUser.email!);
            const bookRef = doc(db, "BiblioBooks", book.id);

            const batch = writeBatch(db);

            const max = orgSettings?.MaximumSimultaneousLoans || 5;

            // Find the first available etat slot
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
                book.id,
                book.name,
                book.cathegorie,
                book.image,
                "BiblioBooks",
                dateReservation,
                1
            ];

            // Update user's reservation state
            batch.update(userRef, {
                [`etat${etatIndex}`]: 'reserv' as EtatValue,
                [`tabEtat${etatIndex}`]: tabEtatEntry,
                reservations: arrayUnion({
                    cathegorie: book.cathegorie,
                    dateReservation,
                    etat: 'reserver' as ReservationEtatValue,
                    exemplaire: 1,
                    image: book.image,
                    name: book.name,
                    nomBD: "BiblioBooks"
                })
            });

            // Decrement the book's available copies
            batch.update(bookRef, {
                exemplaire: increment(-1)
            });

            await batch.commit();

            alert("Livre réservé avec succès!");
        } catch (error) {
            console.error('Erreur lors de la réservation:', error);
            alert("Une erreur est survenue lors de la réservation.");
        } finally {
            setIsReserving(false);
        }
    };

    const getReserveButtonText = () => {
        if (effectiveIsReserved) return 'Voir ma réservation';
        if (!isAvailable) return 'Indisponible';
        if (!currentUser) return 'Se connecter'; // Changé de userLoggedIn à currentUser
        return 'Réserver';
    };

    const isReserveButtonDisabled = !effectiveIsReserved && (!isAvailable || isReserving || isLoading);
    const shouldShowLoginMessage = !currentUser && isAvailable && !isReserved;

    const statusBadge = getStatusBadge();

    if (viewMode === 'grid') {
        return (
            <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
                {clickToReserve ? (
                    <div className="block cursor-pointer" role="button" tabIndex={0} onClick={handleReserve} onKeyDown={(e) => { if (e.key === 'Enter') handleReserve(e as any); }}>
                        ...
                    </div>
                ) : (
                    <Link to={`/books/${book.id}`} className="block">
                        <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                            <img
                                src={book.image || book.imageUrl || '/default-cover.jpeg'}
                                alt={`Couverture de ${book.name}`}
                                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                onError={handleImageError}
                                loading="lazy"
                            />

                            {/* Status Badge */}
                            <div className="absolute top-2 left-2 z-20">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-md border ${statusBadge.color}`}>
                                    {statusBadge.icon}
                                    {statusBadge.text}
                                </div>
                            </div>

                            {/* Favorite Button */}
                            {/* {onToggleFavorite && (
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 z-20 shadow-md ${isFavorite
                                        ? 'bg-red-100 text-red-600 border border-red-200'
                                        : 'bg-white bg-opacity-90 text-gray-600 hover:bg-white hover:bg-opacity-100 border border-gray-200'
                                        }`}
                                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                >
                                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                            )} */}

                            {/* Shelf indicator */}
                            {book.etagere && (
                                <div className="absolute bottom-2 right-2 z-10">
                                    <div className="px-2 py-1 rounded-full bg-black bg-opacity-60 text-white text-xs font-medium">
                                        Ét: {book.etagere}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            {/* Book Title */}
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors">
                                {book.name || book.title}
                            </h3>

                            {/* Author */}
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="line-clamp-1">{book.auteur || book.author}</span>
                            </div>

                            {/* Category */}
                            <div className="mb-3">
                                <span
                                    className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${primaryColor}10`,
                                        color: primaryColor
                                    }}
                                >
                                    {book.cathegorie || book.category}
                                </span>
                            </div>

                            {/* Edition */}
                            {book.edition && (
                                <div className="flex items-center text-xs text-gray-500 mb-3">
                                    <Building className="w-3 h-3 mr-1" />
                                    <span className="truncate">{book.edition}</span>
                                </div>
                            )}

                            {/* Availability Progress Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Exemplaires</span>
                                    <span className="flex items-center">
                                        <Copy className="w-3 h-3 mr-1" />
                                        {book.exemplaire}/{book.initialExemplaire}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${availabilityPercentage}%`,
                                            backgroundColor: getAvailabilityColor()
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Comments */}
                            {book.commentaire && book.commentaire.length > 0 && (
                                <div className="flex items-center text-xs text-gray-500">
                                    <span>{book.commentaire.length} commentaire{book.commentaire.length > 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>
                    </Link>)}

                {/* Reserve Button */}
                <div className="p-4 pt-0">
                    <button
                        onClick={handleReserve}
                        disabled={isReserveButtonDisabled}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${!isReserveButtonDisabled && isAvailable
                            ? 'text-white hover:shadow-lg transform hover:scale-[1.02]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        style={{
                            backgroundColor: !isReserveButtonDisabled && isAvailable ? primaryColor : undefined,
                            cursor: isReserveButtonDisabled ? 'not-allowed' : 'pointer'
                        }}
                        title={shouldShowLoginMessage ? "Connectez-vous pour réserver" : undefined}
                    >
                        {isReserving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Réservation...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {getReserveButtonText()}
                            </>
                        )}
                    </button>

                    {/* Login hint */}
                    {shouldShowLoginMessage && (
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Connectez-vous pour réserver ce livre
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
            <Link to={`/books/${book.id}`} className="flex">
                {/* Book Image */}
                <div className="relative w-32 h-52 flex-shrink-0 overflow-hidden bg-gray-100">
                    <img
                        src={book.image || book.imageUrl || '/default-cover.jpeg'}
                        alt={`Couverture de ${book.name}`}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        onError={handleImageError}
                        loading="lazy"
                    />

                    {/* Status Indicator */}
                    <div className="absolute bottom-1 left-1">
                        <div className={`w-3 h-3 rounded-full ${isReserved ? 'bg-yellow-500' : isAvailable ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                    </div>

                    {/* Shelf */}
                    {book.etagere && (
                        <div className="absolute top-1 right-1">
                            <div className="px-1 py-0.5 rounded text-xs bg-black bg-opacity-60 text-white font-medium">
                                {book.etagere}
                            </div>
                        </div>
                    )}
                </div>

                {/* Book Info */}
                <div className="flex-1 p-4 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-4">
                            {/* Title */}
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-gray-700 transition-colors">
                                {book.name || book.title}
                            </h3>

                            {/* Author */}
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{book.auteur || book.author}</span>
                            </div>

                            {/* Details */}
                            {book.edition && (
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                    <Building className="w-3 h-3 mr-1" />
                                    <span className="truncate">{book.edition}</span>
                                </div>
                            )}

                            {book.etagere && (
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <Package className="w-3 h-3 mr-1" />
                                    <span>Étagère: {book.etagere}</span>
                                </div>
                            )}

                            {/* Description */}
                            {(book.desc || book.description) && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {book.desc || book.description}
                                </p>
                            )}

                            {/* Tags and Info */}
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span
                                    className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${primaryColor}10`,
                                        color: primaryColor
                                    }}
                                >
                                    {book.cathegorie || book.category}
                                </span>

                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.color} flex items-center`}>
                                    {statusBadge.icon}
                                    {statusBadge.text}
                                </span>

                                <span className="text-xs text-gray-500 flex items-center">
                                    <Copy className="w-3 h-3 mr-1" />
                                    {book.exemplaire}/{book.initialExemplaire}
                                </span>

                                {book.commentaire && book.commentaire.length > 0 && (
                                    <span className="text-xs text-gray-500 flex items-center">
                                        {book.commentaire.length} avis
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-xs">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${availabilityPercentage}%`,
                                            backgroundColor: getAvailabilityColor()
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Favorite Button */}
                            {onToggleFavorite && (
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`p-2 rounded-full transition-all duration-200 ${isFavorite
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                >
                                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                            )}

                            {/* Reserve Button */}
                            <button
                                onClick={handleReserve}
                                disabled={isReserveButtonDisabled}
                                className={`py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center ${!isReserveButtonDisabled && isAvailable
                                    ? 'text-white hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                style={{
                                    backgroundColor: !isReserveButtonDisabled && isAvailable ? primaryColor : undefined
                                }}
                            >
                                {isReserving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        <span className="hidden sm:inline">Réservation...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            {getReserveButtonText()}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Login hint for list view */}
                    {shouldShowLoginMessage && (
                        <p className="text-xs text-gray-500 mt-2">
                            Connectez-vous pour réserver ce livre
                        </p>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default BookCard;
