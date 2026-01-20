import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { authService } from '../services/auth/authService';
import { BiblioUser } from '../types/auth';
import { Timestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { getRandomDefaultAvatar } from '../utils/userUtils';

// Import des composants pour les mémoires
import ThesisHeader from '../components/thesis/ThesisHeader';
import ThesisDescription from '../components/thesis/ThesisDescription';
import CommentsSection from '../components/common/CommentsSection';
import CommentModal from '../components/common/CommentModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { historyService } from '../services/historyService';

// Import des interfaces
import { BiblioThesis, ThesisComment, ThesisCommentWithUserData } from '../types/thesis';
import Footer from "../components/layout/Footer";

const ThesisDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { orgSettings } = useConfig();

    // États principaux
    const [thesis, setThesis] = useState<BiblioThesis | null>(null);
    const [commentsWithUserData, setCommentsWithUserData] = useState<ThesisCommentWithUserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // États pour les interactions
    const [isFavorite, setIsFavorite] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';

    // Charger les données utilisateur
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const user = await authService.getCurrentUser();
                if (user) {
                    setCurrentUser(user);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Erreur chargement utilisateur:', error);
            }
        };

        loadUserData();
    }, [id]);

    // Fonction pour récupérer les données utilisateur d'un commentaire
    const getUserDataForComment = async (nomUser: string): Promise<{ userName: string; userAvatar?: string }> => {
        try {
            return {
                userName: nomUser || 'Utilisateur anonyme',
                userAvatar: getRandomDefaultAvatar(nomUser)
            };
        } catch (error) {
            console.error('Erreur récupération données utilisateur:', error);
            return {
                userName: nomUser || 'Utilisateur anonyme',
                userAvatar: getRandomDefaultAvatar(nomUser)
            };
        }
    };

    // Charger les commentaires avec les données utilisateur
    const loadCommentsWithUserData = async (comments: ThesisComment[]) => {
        setLoadingComments(true);

        try {
            const commentsWithData = await Promise.all(
                comments.map(async (comment, index) => {
                    const userData = await getUserDataForComment(comment.nomUser);
                    return {
                        ...comment,
                        id: `comment_${index}_${comment.heure.toMillis()}`,
                        userId: comment.nomUser,
                        userName: userData.userName,
                        userAvatar: userData.userAvatar,
                        helpful: 0
                    } as ThesisCommentWithUserData;
                })
            );

            setCommentsWithUserData(commentsWithData);
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
            setCommentsWithUserData([]);
        } finally {
            setLoadingComments(false);
        }
    };

    // Charger les données du mémoire depuis Firebase
    useEffect(() => {
        const fetchThesisData = async () => {
            if (!id) {
                setError('ID du mémoire manquant');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Récupérer le mémoire depuis Firestore
                const thesisDoc = await getDoc(doc(db, 'BiblioThesis', id));

                if (!thesisDoc.exists()) {
                    setError('Mémoire introuvable dans la base de données');
                    setLoading(false);
                    return;
                }

                const thesisData = { id: thesisDoc.id, ...thesisDoc.data() } as BiblioThesis;
                setThesis(thesisData);

                // Charger les commentaires avec les données utilisateur
                if (thesisData.commentaire && thesisData.commentaire.length > 0) {
                    await loadCommentsWithUserData(thesisData.commentaire);
                } else {
                    console.log('📝 Aucun commentaire pour ce mémoire');
                    setCommentsWithUserData([]);
                }

            } catch (error) {
                console.error('❌ Erreur chargement mémoire:', error);
                setError('Impossible de charger les détails du mémoire. Veuillez réessayer plus tard.');
            } finally {
                setLoading(false);
            }
        };

        fetchThesisData();
    }, [id]);

    // Dans ThesisDetailsPage.tsx

    // ... dans le composant ThesisDetailsPage, après les autres hooks ...

    useEffect(() => {
        // Enregistre la consultation dans l'historique
        if (isAuthenticated && currentUser && thesis) {
            historyService.addHistoryEvent({
                userId: currentUser.id,
                type: 'thesis_view',
                itemId: thesis.id,
                itemTitle: thesis.theme || thesis.name,
                itemCoverUrl: thesis.image,
            });
        }
    }, [isAuthenticated, currentUser, thesis]);
    // Gestion de la consultation
    const handleView = async () => {
        if (!isAuthenticated) {
            navigate('/auth', { state: { from: location } });
            return;
        }

        if (!thesis) {
            return;
        }

        setIsViewing(true);

        try {
            // TODO: Implémenter la logique de consultation
            console.log('📖 Consultation du mémoire:', thesis.id);

            // Simuler un délai
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('✅ Mémoire consulté avec succès');

        } catch (error) {
            console.error('❌ Erreur consultation:', error);
            alert('Erreur lors de la consultation. Veuillez réessayer.');
        } finally {
            setIsViewing(false);
        }
    };

    // Gestion des favoris
    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/auth', { state: { from: location } });
            return;
        }

        try {
            setIsFavorite(!isFavorite);

            const message = isFavorite
                ? 'Mémoire retiré des favoris'
                : 'Mémoire ajouté aux favoris';
            console.log(message);

        } catch (error) {
            console.error('❌ Erreur favoris:', error);
        }
    };

    // Gestion des commentaires
    const handleSubmitComment = async (commentData: { texte: string; note: number; nomUser: string }) => {
        if (!isAuthenticated || !currentUser || !thesis) {
            throw new Error('Non authentifié');
        }

        try {
            const newComment: ThesisComment = {
                heure: Timestamp.now(),
                nomUser: commentData.nomUser,
                note: commentData.note,
                texte: commentData.texte
            };

            // Ajouter le commentaire au mémoire dans Firestore
            const thesisRef = doc(db, 'BiblioThesis', thesis.id);
            await updateDoc(thesisRef, {
                commentaire: arrayUnion(newComment)
            });

            // Mettre à jour l'état local du mémoire
            setThesis(prev => prev ? {
                ...prev,
                commentaire: [newComment, ...prev.commentaire]
            } : null);

            // Créer le commentaire avec données utilisateur pour l'affichage
            const newCommentWithUserData: ThesisCommentWithUserData = {
                ...newComment,
                id: `comment_new_${Date.now()}`,
                userId: currentUser.id || '',
                userName: currentUser.name,
                userAvatar: currentUser.profilePicture || currentUser.imageUri || getRandomDefaultAvatar(currentUser.id),
                helpful: 0
            };

            // Mettre à jour l'état local des commentaires avec données utilisateur
            setCommentsWithUserData(prev => [newCommentWithUserData, ...prev]);

        } catch (error) {
            console.error('❌ Erreur ajout commentaire:', error);
            throw error;
        }
    };

    // Gestion des votes "utile"
    const handleHelpfulClick = async (commentId: string) => {
        if (!isAuthenticated) {
            navigate('/auth');
            return;
        }

        try {
            setCommentsWithUserData(prev =>
                prev.map(comment =>
                    comment.id === commentId
                        ? { ...comment, helpful: (comment.helpful || 0) + 1 }
                        : comment
                )
            );

        } catch (error) {
            console.error('❌ Erreur vote utile:', error);
        }
    };

    const handleLoginRequired = () => {
        navigate('/auth');
    };

    // États de chargement
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner
                    size="xl"
                    text="Chargement des détails du mémoire..."
                    fullScreen
                />
            </div>
        );
    }

    // Gestion des erreurs
    if (error || !thesis) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                    >
                        <svg
                            className="w-8 h-8"
                            style={{ color: primaryColor }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                        Mémoire introuvable
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error || 'Le mémoire que vous recherchez n\'existe pas ou a été supprimé.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-6 py-3 cursor-pointer rounded-lg font-medium text-white transition-colors"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Réessayer
                        </button>
                        <button
                            onClick={() => navigate('/thesis')}
                            className="flex-1 px-6 py-3 cursor-pointer rounded-lg font-medium border-2 transition-colors"
                            style={{
                                borderColor: primaryColor,
                                color: primaryColor
                            }}
                        >
                            Retour aux mémoires
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation breadcrumb */}
            <div className="bg-white mt-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                        >
                            Accueil
                        </button>
                        <span className="text-gray-400">/</span>
                        <button
                            onClick={() => navigate('/thesis')}
                            className="text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                        >
                            Mémoires
                        </button>
                        <span className="text-gray-400">/</span>
                        <span style={{ color: primaryColor }} className="font-medium">
                            {thesis.theme || thesis.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* En-tête du mémoire */}
                    <ThesisHeader
                        thesis={thesis}
                        onView={handleView}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenCommentModal={() => setIsCommentModalOpen(true)}
                        isFavorite={isFavorite}
                        isAuthenticated={isAuthenticated}
                        isViewing={isViewing}
                        commentsWithUserData={commentsWithUserData}
                    />

                    {/* Description du mémoire */}
                    <ThesisDescription thesis={thesis} />

                    {/* Section des commentaires */}
                    <div className="relative">
                        {loadingComments && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-2xl">
                                <LoadingSpinner size="md" text="Chargement des commentaires..." />
                            </div>
                        )}

                        <CommentsSection
                            comments={commentsWithUserData}
                            onOpenCommentModal={() => setIsCommentModalOpen(true)}
                            onHelpfulClick={handleHelpfulClick}
                            isAuthenticated={isAuthenticated}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de commentaire */}
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                onSubmit={handleSubmitComment}
                bookTitle={thesis.theme || `Mémoire de ${thesis.name}`}
                isAuthenticated={isAuthenticated}
                onLoginRequired={handleLoginRequired}
                currentUserName={currentUser?.name || ''}
            />

            {/* Bouton flottant de retour */}
            <button
                onClick={() => navigate('/thesis')}
                className="fixed bottom-6 left-6 w-14 cursor-pointer h-14 rounded-full shadow-xl text-white flex items-center justify-center transition-all duration-200 hover:shadow-2xl hover:scale-110 z-50"
                style={{ backgroundColor: secondaryColor }}
                title="Retour aux mémoires"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <Footer />
        </div>
    );
};

export default ThesisDetailsPage;
