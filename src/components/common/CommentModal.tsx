import React, { useState } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { X, Star, Send, AlertCircle } from 'lucide-react';

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: { texte: string; note: number; nomUser: string }) => Promise<void>;
    bookTitle: string;
    isAuthenticated: boolean;
    onLoginRequired?: () => void;
    currentUserName?: string; // Nom de l'utilisateur connecté
}

const CommentModal: React.FC<CommentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bookTitle,
    isAuthenticated,
    onLoginRequired,
    currentUserName = ''
}) => {
    const { orgSettings } = useConfig();
    const [note, setNote] = useState<number>(5);
    const [hoverNote, setHoverNote] = useState<number>(0);
    const [texte, setTexte] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            onLoginRequired?.();
            return;
        }

        if (!texte.trim()) {
            setError('Veuillez saisir un commentaire');
            return;
        }

        if (texte.trim().length < 10) {
            setError('Le commentaire doit contenir au moins 10 caractères');
            return;
        }

        if (texte.trim().length > 500) {
            setError('Le commentaire ne peut pas dépasser 500 caractères');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onSubmit({
                texte: texte.trim(),
                note: note,
                nomUser: currentUserName || 'Utilisateur anonyme'
            });

            // Réinitialiser le formulaire
            setTexte('');
            setNote(5);
            onClose();
        } catch {
            setError('Erreur lors de l\'envoi du commentaire. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTexte('');
            setNote(5);
            setError('');
            onClose();
        }
    };

    // Évaluation textuelle de la note
    const getRatingText = (rating: number) => {
        switch (rating) {
            case 1: return 'Très décevant';
            case 2: return 'Décevant';
            case 3: return 'Correct';
            case 4: return 'Bon';
            case 5: return 'Excellent';
            default: return '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                            Donner mon avis
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Sur "{bookTitle}"
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Contenu */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Alerte si non authentifié */}
                    {!isAuthenticated && (
                        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-orange-800 mb-1">
                                        Connexion requise
                                    </h3>
                                    <p className="text-orange-700 text-sm">
                                        Vous devez vous connecter pour pouvoir laisser un commentaire et une note.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onLoginRequired}
                                        className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-800 underline"
                                    >
                                        Se connecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Système de notation */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Votre note
                        </label>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="focus:outline-none transition-all duration-150 hover:scale-110"
                                        onMouseEnter={() => setHoverNote(star)}
                                        onMouseLeave={() => setHoverNote(0)}
                                        onClick={() => setNote(star)}
                                        disabled={!isAuthenticated}
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors duration-150 ${star <= (hoverNote || note)
                                                ? 'fill-current text-yellow-400'
                                                : 'text-gray-300'
                                                } ${!isAuthenticated ? 'opacity-50' : 'cursor-pointer'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="ml-4">
                                <span className="text-sm text-gray-600 font-medium">
                                    {note} étoile{note > 1 ? 's' : ''}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getRatingText(hoverNote || note)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Zone de commentaire */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Votre commentaire
                        </label>
                        <textarea
                            value={texte}
                            onChange={(e) => {
                                setTexte(e.target.value);
                                setError('');
                            }}
                            placeholder={
                                isAuthenticated
                                    ? "Partagez votre expérience avec ce livre... Qu'avez-vous aimé ? Qu'est-ce qui vous a marqué ?"
                                    : "Connectez-vous pour laisser un commentaire"
                            }
                            rows={6}
                            maxLength={500}
                            disabled={!isAuthenticated}
                            className={`w-full p-4 border rounded-xl resize-none transition-all duration-200 ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                } focus:ring-2 focus:ring-opacity-50 disabled:bg-gray-50 disabled:text-gray-500`}
                        />
                        <div className="flex justify-between mt-2">
                            <span className={`text-sm ${error ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {error || `${texte.length}/500 caractères`}
                            </span>
                            {texte.length > 0 && texte.length < 10 && (
                                <span className="text-sm text-amber-600">
                                    {10 - texte.length} caractères minimum
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Conseils */}
                    <div className="mb-6 bg-gray-50 rounded-xl p-4">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <span className="mr-2">💡</span>
                            Conseils pour un bon commentaire
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Décrivez ce que vous avez aimé ou moins aimé dans ce livre</li>
                            <li>• Mentionnez le style d'écriture, l'intrigue, les personnages</li>
                            <li>• Restez respectueux et constructif dans vos critiques</li>
                            <li>• Évitez les spoilers importants qui gâteraient la lecture</li>
                        </ul>
                    </div>

                    {/* Prévisualisation si texte saisi */}
                    {texte.trim() && texte.length >= 10 && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <h4 className="font-medium text-blue-800 mb-2">Aperçu de votre avis :</h4>
                            <div className="flex items-center mb-2">
                                <div className="flex items-center mr-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= note
                                                ? 'fill-current text-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-blue-800">
                                    {currentUserName || 'Votre nom'}
                                </span>
                            </div>
                            <p className="text-sm text-blue-700 italic">"{texte.trim()}"</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="sm:w-auto px-6 py-3 cursor-pointer rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>

                        <button
                            type="submit"
                            disabled={!isAuthenticated || isSubmitting || !texte.trim() || texte.length < 10}
                            className="flex-1 sm:flex-none cursor-pointer px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            style={{
                                backgroundColor: isAuthenticated && !isSubmitting && texte.trim().length >= 10
                                    ? primaryColor
                                    : '#9ca3af'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Publier mon avis
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;
