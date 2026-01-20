// src/types/chat.ts
import { Timestamp } from 'firebase/firestore';

export interface SharedMessage {
  id: string;
  recue: 'E' | 'R'; // E for Envoyé (Sent), R for Reçu (Received)
  texte: string;
  heure: Timestamp;
  lu: boolean;
  type?: 'admin' | 'bot';
}

export interface Conversation {
  id: string; // User email
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  messages: SharedMessage[];
  lastMessageText: string;
  lastMessageTimestamp: Timestamp;
  unreadByUser?: boolean;
}

export interface Message extends SharedMessage {
  conversationId: string;
  senderId: 'user' | 'admin';
  senderName?: string;
}