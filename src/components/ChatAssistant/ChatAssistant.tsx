import React, { useState, useRef, useEffect } from 'react';
import { AssistantApi } from '../../services/api/AssistantApi';
import { useAuth } from '../../contexts/AuthContext';
import './ChatAssistant.css';

// Icônes
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
);

// Types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatAssistantProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  welcomeMessage?: string;
  primaryColor?: string;
  accentColor?: string;
  offlineMode?: boolean;
  orgName?: string;
  apiUrl?: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  position = 'bottom-right',
  welcomeMessage = "Bonjour! Je suis votre assistant de bibliothèque. Comment puis-je vous aider aujourd'hui ?",
  primaryColor = '#2563eb',
  accentColor = '#3b82f6',
  offlineMode = false,
  orgName = 'OrgSettings',
  apiUrl,
}) => {
  //@ts-ignore
  const { currentUser } = useAuth() || {};

  const [assistantApi] = useState(() => {
    return new AssistantApi(apiUrl);
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: welcomeMessage,
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<Array<{ text: string, query: string }>>([]);
  const [libraryName, setLibraryName] = useState('Bibliothèque');
  const [apiAvailable, setApiAvailable] = useState(true);

  // Book search state
  const [bookSearchStep, setBookSearchStep] = useState<'title' | 'author' | null>(null);
  const [bookTitle, setBookTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Vérifier la disponibilité de l'API et charger les données
  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        const isHealthy = await assistantApi.checkHealth();
        setApiAvailable(isHealthy);

        if (isHealthy) {
          const libraryInfo = await assistantApi.getLibraryInfo(orgName);
          if (libraryInfo) {
            setLibraryName(libraryInfo.name);
            
            // Update welcome message with library name
            setMessages(prev => 
              prev.map(msg => 
                msg.id === 'welcome' 
                  ? {...msg, content: `Bonjour! Je suis l'assistant de la bibliothèque ${libraryInfo.name}. Comment puis-je vous aider aujourd'hui ?`}
                  : msg
              )
            );
          }

          const suggestions = await assistantApi.getQuickSuggestions(orgName);
          setQuickSuggestions(suggestions);
        } else {
          setQuickSuggestions([
            { text: "📅 Horaires", query: "Quels sont les horaires d'ouverture ?" },
            { text: "📚 Règles", query: "Quelles sont les règles d'emprunt ?" },
            { text: "📞 Contact", query: "Comment contacter la bibliothèque ?" },
            { text: "📍 Adresse", query: "Où se trouve la bibliothèque ?" },
            { text: "🔍 Chercher un livre", query: "Chercher un livre" },
          ]);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setApiAvailable(false);
        setQuickSuggestions([
          { text: "📅 Horaires", query: "Quels sont les horaires d'ouverture ?" },
          { text: "📚 Règles", query: "Quelles sont les règles d'emprunt ?" },
          { text: "📞 Contact", query: "Comment contacter la bibliothèque ?" },
          { text: "🔍 Chercher un livre", query: "Chercher un livre" },
        ]);
      }
    };

    if (isOpen) {
      initializeChatbot();
    }
  }, [isOpen, orgName, assistantApi]);

  // Ouverture automatique au survol
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isHovered && !isOpen) {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isHovered, isOpen]);

  // Défilement automatique
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus automatique
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetBookSearch = () => {
    setBookSearchStep(null);
    setBookTitle('');
  };

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Handle step-by-step book search
    if (bookSearchStep === 'title') {
      // User entered book title
      setBookTitle(message);
      setBookSearchStep('author');
      setInputValue('');

      // Ask for author
      const authorPrompt: Message = {
        id: Date.now().toString(),
        content: "Merci! Maintenant, quel est le nom de l'auteur ? (Tapez 'non' si vous ne le connaissez pas)",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, authorPrompt]);
      return;
    }

    if (bookSearchStep === 'author') {
      // User entered author
      const author = message.toLowerCase() === 'non' ? '' : message;

      // Add user message
      let userQueryText;
      if (author) {
        userQueryText = `Recherche du livre "${bookTitle}" par ${author}`;
      } else {
        userQueryText = `Recherche du livre "${bookTitle}"`;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content: userQueryText,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      // Typing indicator
      const typingMessage: Message = {
        id: 'typing',
        content: '...',
        sender: 'assistant',
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, typingMessage]);

      try {
        if (!apiAvailable || offlineMode) {
          throw new Error('API non disponible');
        }

        // Use the direct method to avoid parsing issues
        const response = await assistantApi.checkBookAvailabilityDirect(bookTitle, author || undefined);

        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Erreur lors de la recherche de livre:', error);

        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

        let errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Désolé, je n'ai pas pu rechercher le livre. Veuillez réessayer ou contacter la bibliothèque.",
          sender: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        resetBookSearch();
      }

      return;
    }

    const userMessageContent = message;

    // Add user message to UI immediately for responsiveness
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userMessageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!apiAvailable || offlineMode) {
        throw new Error('API non disponible');
      }

      // Typing indicator for Bot
      const typingMessage: Message = {
        id: 'typing',
        content: '...',
        sender: 'assistant',
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages(prev => [...prev, typingMessage]);

      // Bot Response
      const response = await assistantApi.getAssistantResponse(userMessageContent, orgName);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update check logic...
      const lowerMessage = message.toLowerCase();
      const isBookQuery = lowerMessage.includes('chercher') ||
        lowerMessage.includes('rechercher') ||
        (lowerMessage.includes('livre') && !lowerMessage.includes('"'));

      // Check if response indicates we need more info
      const lowerResponse = response.toLowerCase();
      const needsMoreInfo = lowerResponse.includes('fournir') ||
        lowerResponse.includes('titre') ||
        lowerResponse.includes('veuillez') ||
        lowerResponse.includes('exemple');

      if (isBookQuery && needsMoreInfo) {
        // Start step-by-step book search
        setBookSearchStep('title');

        const titlePrompt: Message = {
          id: (Date.now() + 2).toString(),
          content: "Pour rechercher un livre, donnez-moi d'abord le titre :",
          sender: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, titlePrompt]);
      } else {
        resetBookSearch();
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message :', error);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));

      let errorMessage: Message;

      if (offlineMode) {
        errorMessage = {
          id: (Date.now() + 1).toString(),
          content: "Je suis actuellement hors ligne. Veuillez réessayer plus tard.",
          sender: 'assistant',
          timestamp: new Date(),
        };
      } else if (!apiAvailable) {
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = "Je comprends votre question. Pour des informations précises, veuillez contacter la bibliothèque directement.";

        if (lowerMessage.includes('heure') || lowerMessage.includes('horaires')) {
          fallbackResponse = "🕐 Horaires standards:\nLundi-Vendredi: 9h-18h\nSamedi: 10h-17h\nDimanche: Fermé\n\nVeuillez contacter la bibliothèque pour les horaires exacts.";
        } else if (lowerMessage.includes('contact')) {
          fallbackResponse = "📞 Contactez-nous par téléphone ou email. Les coordonnées exactes ne sont pas disponibles actuellement.";
        } else if (lowerMessage.includes('règle')) {
          fallbackResponse = "📚 Règles d'emprunt standards:\n• 10 livres maximum\n• Durée: 3 semaines\n• Réservation en ligne disponible";
        } else if (lowerMessage.includes('livre')) {
          fallbackResponse = "🔍 Pour rechercher un livre, veuillez contacter directement la bibliothèque ou consulter le catalogue en ligne.";
        }

        errorMessage = {
          id: (Date.now() + 1).toString(),
          content: fallbackResponse,
          sender: 'assistant',
          timestamp: new Date(),
        };
      } else {
        errorMessage = {
          id: (Date.now() + 1).toString(),
          content: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer ultérieurement.",
          sender: 'assistant',
          timestamp: new Date(),
        };
      }

      setMessages(prev => [...prev, errorMessage]);
      resetBookSearch();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsHovered(false);
    setIsMinimized(false);
    resetBookSearch();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-left';
      case 'top-right':
        return 'top-right';
      case 'top-left':
        return 'top-left';
      default:
        return 'bottom-right';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuickSuggestion = (suggestion: { text: string; query: string }) => {
    if (suggestion.text.includes("🔍")) {
      // For book search, start the step-by-step process
      resetBookSearch();

      // Add a prompt message
      const promptMessage: Message = {
        id: Date.now().toString(),
        content: "Je vais vous aider à rechercher un livre. D'abord, quel est le titre du livre ?",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, promptMessage]);

      // Set book search step
      setBookSearchStep('title');
      setInputValue('');

      // Focus the input field
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      // For other suggestions, set the query and trigger send
      setInputValue(suggestion.query);
      resetBookSearch();

      // Focus immediately for other suggestions
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      // Auto-send after a short delay
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div
      className={`chat-assistant ${getPositionClasses()} ${isOpen ? 'open' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--primary-color': primaryColor,
        '--accent-color': accentColor,
      } as React.CSSProperties}
    >
      {/* Bouton de bascule */}
      {!isOpen && (
        <button
          className="chat-toggle-button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir l'assistant de chat"
        >
          <ChatIcon />
          {!apiAvailable && <span className="offline-badge">⚠️</span>}
          {offlineMode && <span className="offline-badge">Hors ligne</span>}
          {isHovered && <span className="tooltip">Assistant {libraryName}</span>}
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="chat-window" ref={chatContainerRef}>
          {/* Entête */}
          <div className="chat-header">
            <div className="header-info">
              <div className="avatar">
                <ChatIcon />
              </div>
              <div>
                <h3>Assistant {libraryName}</h3>
                <div className="status">
                  <span className={`status-indicator ${offlineMode || !apiAvailable ? 'offline' : 'online'}`}></span>
                  <span className="status-text">
                    {offlineMode ? 'Hors ligne' : apiAvailable ? 'En ligne' : 'Connexion limitée'}
                  </span>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="icon-button minimize-btn"
                onClick={toggleMinimize}
                aria-label={isMinimized ? "Agrandir" : "Réduire"}
              >
                <MinimizeIcon />
              </button>
              <button
                className="icon-button close-btn"
                onClick={handleCloseChat}
                aria-label="Fermer"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Corps du chat */}
          {!isMinimized && (
            <>
              <div className="chat-body">
                <div className="messages-container">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender} ${message.isTyping ? 'typing' : ''}`}
                    >
                      <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {message.isTyping ? (
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions rapides */}
                <div className="quick-actions">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="quick-action-btn"
                      onClick={() => handleQuickSuggestion(suggestion)}
                      disabled={bookSearchStep !== null && suggestion.text.includes("🔍")}
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone de saisie */}
              <div className="chat-input">
                {bookSearchStep && (
                  <div className="book-search-step">
                    {bookSearchStep === 'title' ? '📖 Étape 1: Titre du livre' : '✍️ Étape 2: Nom de l\'auteur'}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    bookSearchStep === 'title'
                      ? "Ex: Le Petit Prince"
                      : bookSearchStep === 'author'
                        ? "Ex: Antoine de Saint-Exupéry (ou tapez 'non')"
                        : "Tapez votre question ici..."
                  }
                  disabled={isLoading}
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Envoyer"
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}

          {/* Vue réduite */}
          {isMinimized && (
            <div className="minimized-view">
              <span>Assistant {libraryName}</span>
              <button
                className="restore-btn"
                onClick={toggleMinimize}
                aria-label="Agrandir"
              >
                Agrandir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};