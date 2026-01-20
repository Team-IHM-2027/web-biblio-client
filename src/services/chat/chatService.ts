import {
    doc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { BiblioUser, MessageItem } from '../../types/auth';

export class ChatService {
    private ws: WebSocket | null = null;
    private unsubscribeFirestore: (() => void) | null = null;
    private readonly WS_URL = "ws://192.168.43.78:3000";

    /**
     * Resolve the user document reference (handling Email or UID keys)
     */
    private async getUserDocRef(userId: string, email?: string) {
        let userDocRef = doc(db, 'BiblioUser', email || userId);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            userDocRef = doc(db, 'BiblioUser', userId);
            userSnap = await getDoc(userDocRef);
        }

        return userSnap.exists() ? userDocRef : null;
    }

    /**
     * Subscribe to messages from Firestore
     */
    async subscribeToMessages(userId: string, email: string | undefined, onMessages: (messages: MessageItem[]) => void) {
        const userDocRef = await this.getUserDocRef(userId, email);

        if (!userDocRef) {
            console.warn('❌ User document not found for chat subscription');
            return () => { };
        }

        this.unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as BiblioUser;
                onMessages(data.messages || []);
            }
        });

        return this.unsubscribeFirestore;
    }

    /**
     * Connect to WebSocket for real-time admin chat
     */
    connectWebSocket(email: string, onMessageReceived: (text: string) => void) {
        if (this.ws) this.ws.close();

        this.ws = new WebSocket(this.WS_URL);

        this.ws.onopen = () => {
            console.log("📡 Client: Connected to WebSocket server");
            this.ws?.send(JSON.stringify({
                type: "IDENTIFY",
                email: email
            }));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ADMIN_MESSAGE") {
                    onMessageReceived(data.message);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        this.ws.onerror = (err) => console.error("❌ WebSocket error:", err);
        this.ws.onclose = () => console.log("🔌 WebSocket disconnected");
    }

    /**
     * Disconnect services
     */
    disconnect() {
        this.ws?.close();
        this.unsubscribeFirestore?.();
    }

    /**
     * Send a message through all channels
     */
    async sendMessage(userId: string, email: string, text: string) {
        const userDocRef = await this.getUserDocRef(userId, email);
        if (!userDocRef) throw new Error("User document not found");

        const messageId = Date.now().toString();
        const timestamp = Timestamp.now();

        const newMessage: MessageItem = {
            id: messageId,
            recue: 'E',
            texte: text,
            heure: timestamp,
            lu: false,
            type: 'bot'
        };

        // 1. Save to Firestore
        await updateDoc(userDocRef, {
            messages: arrayUnion(newMessage)
        });

        // 2. Send via WebSocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "USER_MESSAGE",
                email: email,
                text: text
            }));
        }

        return newMessage;
    }

    /**
     * Receive a message (from WebSocket or Bot) and save to Firestore
     */
    async receiveMessage(userId: string, email: string, text: string) {
        const userDocRef = await this.getUserDocRef(userId, email);
        if (!userDocRef) return;

        const messageId = Date.now().toString();
        const timestamp = Timestamp.now();

        await updateDoc(userDocRef, {
            messages: arrayUnion({
                id: messageId,
                recue: 'R',
                texte: text,
                heure: timestamp,
                lu: false,
                type: 'bot'
            })
        });
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId: string, email: string) {
        const userDocRef = await this.getUserDocRef(userId, email);
        if (!userDocRef) return;

        const snap = await getDoc(userDocRef);
        if (!snap.exists()) return;

        const messages = (snap.data().messages || []) as MessageItem[];
        let hasChanges = false;

        const updatedMessages = messages.map(msg => {
            if (msg.recue === 'R' && !msg.lu) {
                hasChanges = true;
                return { ...msg, lu: true, lue: true };
            }
            return msg;
        });

        if (hasChanges) {
            await updateDoc(userDocRef, { messages: updatedMessages });
        }
    }
}

export const chatService = new ChatService();
