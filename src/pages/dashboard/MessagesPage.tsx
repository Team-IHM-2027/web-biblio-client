import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { getUserConversation, subscribeToUserMessages } from '../../services/chatService';
import { useSafeAuth } from '../../hooks/useSafeAuth';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { MessageSquare, Menu, X, Search } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Conversation } from '../../types/chat';

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, isLoading: authLoading } = useSafeAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser?.email) {
      navigate('/auth', { state: { from: location }, replace: true });
      return;
    }

    const loadInitialData = async () => {
      try {
        const myConv = await getUserConversation(currentUser.email!);
        if (myConv) {
          myConv.messages = myConv.messages.filter(msg => msg.type !== 'bot');
          setConversations([myConv]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    const unsubscribe = subscribeToUserMessages(
      currentUser.email!,
      (allMessages) => {
        const messages = allMessages.filter(msg => msg.type !== 'bot');
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        const updated: Conversation = {
          id: currentUser.email!,
          userId: currentUser.email!,
          userName: currentUser.name || 'Moi',
          userEmail: currentUser.email!,
          messages: messages,
          lastMessageText: lastMsg?.texte || '',
          lastMessageTimestamp: lastMsg?.heure || (messages[0]?.heure) || Timestamp.now(),
          unreadByUser: messages.some(msg => msg.recue === 'R' && !msg.lu)
        };
        setConversations([updated]);
      }
    );

    return () => unsubscribe();
  }, [currentUser, authLoading, navigate]);

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {showSidebar ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:relative z-40 w-full md:w-80 h-full
          bg-white border-r border-gray-100 transform transition-transform
          duration-300 ease-in-out flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MessageSquare className="text-blue-500 mr-3" size={24} />
              <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
              />
            ))
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-gray-300" size={28} />
              </div>
              <p className="text-gray-500 font-medium">Aucune conversation</p>
              <p className="text-xs text-gray-400 mt-1">Commencez à discuter avec l'équipe de la bibliothèque.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {conversationId ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="text-blue-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Vos Conversations
            </h2>
            <p className="text-gray-500 max-w-sm mb-8">
              Sélectionnez la conversation avec la bibliothécaire pour discuter de vos emprunts ou obtenir de l'aide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;