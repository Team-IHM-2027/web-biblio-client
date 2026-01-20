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
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const message: Message = {
            id: doc.id,
            conversationId: data.conversationId,
            text: data.content || '',
            senderId: data.sender === 'admin' ? 'admin' : 'user',
            senderName: data.senderName || 'User',
            timestamp: data.timestamp || Timestamp.now(),
            read: data.read || false,
            type: data.type || 'text'
          };
          
          messagesData.push(message);

          // Mark user-received messages as read automatically
          if (message.senderId === 'admin' && !message.read) {
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
      read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

export default useChatMessages;