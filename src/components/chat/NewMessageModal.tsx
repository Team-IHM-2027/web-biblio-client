import React, { useState } from 'react';
import { findOrCreateConversation } from '../../services/chatService';
import { useSafeAuth } from '../../hooks/useSafeAuth';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSent: (conversationId: string) => void;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onMessageSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useSafeAuth();

  const handleStartChat = async () => {
    if (!currentUser?.email || !currentUser?.name) {
      setError('Informations utilisateur manquantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conversationId = await findOrCreateConversation(
        currentUser.email,
        currentUser.name
      );
      onMessageSent(conversationId);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Erreur lors de la création de la conversation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Nouvelle conversation</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Démarrer une conversation avec l'équipe de support de la bibliothèque.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleStartChat}
            loading={loading}
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            Démarrer une conversation
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            fullWidth
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;