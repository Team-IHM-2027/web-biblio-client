// src/hooks/useChatMessages.ts
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import type { Message } from '../types/chat';

export const useChatMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const messagesRef = collection(db, 'Messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('heure', 'asc'),  // Use 'heure' not 'timestamp'
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Determine recue value based on sender
          // 'E' (Envoyé) if sender is admin to user? Or 'R' (Reçu) if user receives?
          // Based on your logic: if senderId === 'admin', user receives it (R)
          // if senderId === 'user', admin receives it (E from user perspective)
          const isFromAdmin = data.sender === 'admin' || data.senderId === 'admin';
          const recue: 'E' | 'R' = isFromAdmin ? 'R' : 'E'; // 'R' = Reçu (Received by user)
          
          const message: Message = {
            id: doc.id,
            conversationId: data.conversationId,
            recue: recue,  // 'E' or 'R'
            texte: data.content || data.texte || '',  // Message content
            heure: data.timestamp || data.heure || Timestamp.now(),  // Time
            lu: data.read || data.lu || false,  // Read status
            type: data.type || 'text',
            senderId: data.sender === 'admin' || data.senderId === 'admin' ? 'admin' : 'user',
            senderName: data.senderName || (isFromAdmin ? 'Administrateur' : 'Utilisateur')
          };
          
          messagesData.push(message);

          // Mark messages as read if they're from admin and not read
          // Only mark as read if current user is not the admin
          if (message.senderId === 'admin' && !message.lu) {
            markMessageAsRead(doc.id);
          }
        });
        setMessages(messagesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading };
};

const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, 'Messages', messageId);
    await updateDoc(messageRef, {
      lu: true  // Use French property name
      // Also update English property if exists
      // read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

export default useChatMessages;