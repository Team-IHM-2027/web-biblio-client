import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import type { Conversation, SharedMessage } from '../types/chat';

// WebSocket instance
let wsInstance: WebSocket | null = null;

export const initializeWebSocket = (userId: string, userName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const WS_URL = 'ws://192.168.43.78:3000';
      wsInstance = new WebSocket(WS_URL);

      wsInstance.onopen = () => {
        console.log('✅ WebSocket connected');
        wsInstance?.send(JSON.stringify({
          type: "IDENTIFY",
          email: userId
        }));
        resolve();
      };

      wsInstance.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      wsInstance.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        wsInstance = null;
      };
    } catch (error) {
      reject(error);
    }
  });
};

export const getWebSocket = (): WebSocket | null => {
  return wsInstance;
};

export const sendWebSocketMessage = (data: any): void => {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify(data));
  } else {
    console.warn('WebSocket not connected');
  }
};

// Envoyer un message (Logique partagée avec le mobile)
export const sendMessage = async (
  userEmail: string,
  text: string,
  sender: 'user' | 'admin'
): Promise<string> => {
  try {
    const userRef = doc(db, "BiblioUser", userEmail);
    const dt = Timestamp.fromDate(new Date());
    const messageId = Date.now().toString();

    const newMessage: SharedMessage = {
      id: messageId,
      recue: sender === 'user' ? 'E' : 'R',
      texte: text.trim(),
      heure: dt,
      lu: sender === 'admin' ? false : true, // User messages are considered "read" by user immediately
      type: 'admin'
    };

    await updateDoc(userRef, {
      messages: arrayUnion(newMessage)
    });

    // Send via WebSocket if open
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify({
        type: sender === 'user' ? "USER_MESSAGE" : "ADMIN_MESSAGE",
        email: userEmail,
        text: text.trim(),
        message: text.trim() // ADMIN_MESSAGE expects 'message' field in file3.js logic
      }));
    }

    // Secondary storage for admin tracking if needed (keeping mobile compatibility)
    try {
      const msgEnvoyeRef = doc(db, 'MessagesEnvoyé', text.substring(0, 100)); // Using substring as ID like file3.js
      await updateDoc(msgEnvoyeRef, {
        email: userEmail,
        messages: text,
        nom: userEmail,
        lue: false
      }).catch(async () => {
        // Fallback if doc doesn't exist
        const { setDoc } = await import('firebase/firestore');
        await setDoc(msgEnvoyeRef, {
          email: userEmail,
          messages: text,
          nom: userEmail,
          lue: false
        });
      });
    } catch (e) {
      console.warn("Could not save to MessagesEnvoyé:", e);
    }

    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark messages as read in BiblioUser document
export const markMessagesAsRead = async (userEmail: string): Promise<void> => {
  try {
    const userRef = doc(db, "BiblioUser", userEmail);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const messages = userData.messages || [];

      const hasUnread = messages.some((msg: any) => msg.recue === 'R' && !msg.lu);
      if (!hasUnread) return;

      const updatedMessages = messages.map((msg: any) =>
        msg.recue === 'R' ? { ...msg, lu: true } : msg
      );

      await updateDoc(userRef, { messages: updatedMessages });
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};

// Récupérer la "conversation" d'un utilisateur (son document BiblioUser)
export const getUserConversation = async (userEmail: string): Promise<Conversation | null> => {
  try {
    const userRef = doc(db, 'BiblioUser', userEmail);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const messages = data.messages || [];
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

      return {
        id: userEmail,
        userId: userEmail,
        userName: data.name || userEmail,
        userEmail: userEmail,
        userImage: data.profileImage,
        messages: messages,
        lastMessageText: lastMsg?.texte || '',
        lastMessageTimestamp: lastMsg?.heure || data.createdAt || Timestamp.now(),
        unreadByUser: messages.some((msg: any) => msg.recue === 'R' && !msg.lu)
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

export const subscribeToUserMessages = (
  userEmail: string,
  callback: (messages: SharedMessage[]) => void
): (() => void) => {
  const userRef = doc(db, 'BiblioUser', userEmail);

  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data.messages || []);
    }
  });
};