// src/components/chat/ConversationItem.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import type { Conversation } from '../../types/chat';
import { isToday, isYesterday, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ conversation }) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    if (isToday(date)) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday(date)) {
      return 'Hier';
    } else {
      return format(date, 'dd MMM', { locale: fr });
    }
  };

  const lastMessageTime = formatTime(conversation.lastMessageTimestamp);

  return (
    <NavLink
      to={`/dashboard/messages/${conversation.id}`}
      className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-gray-50'
        }`}
    >
      <div className="relative mr-3 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        {/* Badge pour messages non lus */}
        {conversation.unreadByUser && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-800 truncate text-sm">
            Bibliothécaire
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {lastMessageTime}
          </span>
        </div>

        <p className="text-sm text-gray-600 truncate line-clamp-1">
          {conversation.lastMessageText || 'Aucun message'}
        </p>

        {/* Statut en ligne/offline */}
        {conversation.userName === 'Admin' && (
          <div className="flex items-center mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            <span className="text-xs text-gray-500">En ligne</span>
          </div>
        )}
      </div>
    </NavLink>
  );
};

export default ConversationItem;