import React, { useState } from 'react';
import { getUserConversation } from '../../services/chatService';
import { useSafeAuth } from '../../hooks/useSafeAuth';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

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
  const { orgSettings } = useConfig();
  const primaryColor = orgSettings?.Theme?.Primary || '#3b82f6';

  const handleStartChat = async () => {
    if (!currentUser?.email || !currentUser?.name) {
      setError('Informations utilisateur manquantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // getUserConversation returns Conversation | null
      const conversation = await getUserConversation(currentUser.email);

      // Check if conversation exists and has an id
      if (!conversation) {
        throw new Error('La conversation n\'a pas pu être créée');
      }

      if (!conversation.id) {
        throw new Error('ID de conversation manquant');
      }

      // Pass the conversation ID string to onMessageSent
      onMessageSent(conversation.id);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la conversation');
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
            className="hover:opacity-90 text-white"
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
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