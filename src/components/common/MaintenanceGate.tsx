import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useConfig } from '../../contexts/ConfigContext';
import { db } from '../../configs/firebase';

const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { orgSettings } = useConfig();
    const [liveMaintenance, setLiveMaintenance] = useState<boolean | null>(null);

    useEffect(() => {
        const ref = doc(db, 'Configuration', 'OrgSettings');
        const unsubscribe = onSnapshot(
            ref,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setLiveMaintenance(null);
                    return;
                }
                const data = snapshot.data();
                setLiveMaintenance(Boolean(data?.MaintenanceMode));
            },
            (error) => {
                console.error('Maintenance listener error:', error);
                setLiveMaintenance(null);
            }
        );

        return () => unsubscribe();
    }, []);

    const maintenanceEnabled = liveMaintenance ?? Boolean(orgSettings?.MaintenanceMode);

    if (maintenanceEnabled) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
                <div className="max-w-xl text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <h1 className="text-3xl font-semibold">Maintenance en cours</h1>
                    <p className="text-white/80">
                        L'application est actuellement en maintenance. Veuillez revenir plus tard.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default MaintenanceGate;
