import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../configs/firebase';

export interface ClientAlert {
    id: string;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    createdAt?: { toMillis?: () => number } | null;
}

const LAST_ALERT_KEY = 'lastClientAlertId';

export const useClientAlerts = () => {
    const [activeAlert, setActiveAlert] = useState<ClientAlert | null>(null);
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'SystemAlerts'),
            where('targetRole', '==', 'client')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    setActiveAlert(null);
                    return;
                }

                const next = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...(docSnap.data() as ClientAlert)
                }));

                next.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                const latest = next[0];
                if (!latest?.id) {
                    setActiveAlert(null);
                    return;
                }

                if (typeof window === 'undefined') {
                    setActiveAlert(latest);
                    return;
                }

                const lastSeen = window.localStorage.getItem(LAST_ALERT_KEY);
                setLastSeenId(lastSeen);
                if (!lastSeen || lastSeen !== latest.id) {
                    setActiveAlert(latest);
                } else {
                    setActiveAlert(null);
                }
            },
            (error) => {
                console.error('Client alerts listener error:', error);
                setActiveAlert(null);
            }
        );

        return () => unsubscribe();
    }, []);

    const acknowledgeAlert = (alertId: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(LAST_ALERT_KEY, alertId);
        setLastSeenId(alertId);
        setActiveAlert(null);
    };

    return { activeAlert, acknowledgeAlert };
};
