// src/hooks/useUserMessages.ts
import { useState, useEffect } from 'react';
import { subscribeToUserMessages } from '../services/chatService';
import type { SharedMessage } from '../types/chat';

export const useUserMessages = (userEmail?: string) => {
    const [messages, setMessages] = useState<SharedMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToUserMessages(userEmail, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userEmail]);

    return { messages, loading };
};

export default useUserMessages;
