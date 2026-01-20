// src/components/chat/ChatWindow.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserMessages } from '../../hooks/useUserMessages';
import { sendMessage, markMessagesAsRead } from '../../services/chatService';
import { MessageBubble } from '../../components/common/MessageBubble';
import { Send, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { SharedMessage, Message } from '../../types/chat';
import { isSameDay, format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

// Helper function for date segmentation
const getMessagesWithDateDividers = (
  messages: SharedMessage[]
): (SharedMessage | { type: 'date_divider'; date: string })[] => {
  const itemsWithDividers: (SharedMessage | { type: 'date_divider'; date: string })[] = [];
  let lastDate: Date | null = null;

  messages.forEach(message => {
    if (message.heure) {
      const messageDate = (message.heure as any).toDate ? (message.heure as any).toDate() : new Date(message.heure as any);

      // Date Divider Logic
      if (!lastDate || !isSameDay(messageDate, lastDate)) {
        let dividerText: string;
        if (isToday(messageDate)) {
          dividerText = "Aujourd'hui";
        } else if (isYesterday(messageDate)) {
          dividerText = 'Hier';
        } else {
          dividerText = format(messageDate, 'dd MMMM yyyy', { locale: fr });
        }
        itemsWithDividers.push({ type: 'date_divider', date: dividerText });
      }

      itemsWithDividers.push(message);
      lastDate = messageDate;
    } else {
      itemsWithDividers.push(message);
    }
  });

  return itemsWithDividers;
};

export const ChatWindow: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { messages: allMessages, loading } = useUserMessages(conversationId);
  const messages = allMessages.filter(msg => msg.type !== 'bot');
  const [newMessage, setNewMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (conversationId) {
      markMessagesAsRead(conversationId);
    }
  }, [conversationId, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    if (!conversationId || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(conversationId, newMessage, 'user');
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError("Échec de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!conversationId) return null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const messagesWithDividers = getMessagesWithDateDividers(messages);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 flex items-center bg-white">
        <button
          onClick={() => navigate('/dashboard/messages')}
          className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Retour aux conversations"
        >
          <ArrowLeft className="text-xl text-gray-700" />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-gray-800">Bibliothécaire</h2>
          <p className="text-sm text-gray-600">Equipe de la bibliothèque</p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messagesWithDividers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messagesWithDividers.map((item, index) => {
            if ('type' in item && item.type === 'date_divider') {
              return (
                <div key={`divider-${index}`} className="text-center my-4">
                  <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                    {item.date}
                  </span>
                </div>
              );
            }

            const msg = item as SharedMessage;
            // Map SharedMessage to UI Message structure if needed by MessageBubble
            const uiMessage: Message = {
              ...msg,
              conversationId: conversationId,
              senderId: msg.recue === 'R' ? 'admin' : 'user',
            };

            return (
              <MessageBubble
                key={msg.id || `msg-${index}`}
                message={uiMessage}
                isSender={uiMessage.senderId === 'user'}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="relative">
          {sendError && (
            <p className="text-red-500 text-sm mb-2 text-center">{sendError}</p>
          )}

          <div className="flex items-end space-x-2">
            <textarea
              value={newMessage}
              onChange={(e: any) => {
                setNewMessage(e.target.value);
                if (sendError) setSendError(null);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1 min-h-[44px] max-h-[120px] px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isSending}
            />

            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className={`p-3 rounded-lg transition-all ${newMessage.trim() && !isSending
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2 text-center">
            Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;