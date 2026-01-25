import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { configService } from '../services/configService';
import { OrgSettings, AppSettings } from '../types/config';

interface ConfigContextType {
    orgSettings: OrgSettings | null;
    appSettings: AppSettings | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    testConnection: () => Promise<boolean>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
    const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
    const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Test de connexion Firebase d'abord
            const isConnected = await configService.testFirebaseConnection();
            if (!isConnected) {
                throw new Error('Impossible de se connecter à Firebase');
            }

            const [orgData, appData] = await Promise.all([
                configService.getOrgSettings(),
                configService.getAppSettings()
            ]);

            setOrgSettings(orgData);
            setAppSettings(appData);

            // Vérifier si les données viennent vraiment de Firebase
            if (orgData.Name === 'BiblioENSPY' && !orgData.Logo) {
                setError('Utilisation des paramètres par défaut. Vérifiez votre base de données Firebase.');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(`Erreur de configuration: ${errorMessage}`);

            // Charger les paramètres par défaut en cas d'erreur
            try {
                const [orgData, appData] = await Promise.all([
                    configService.getOrgSettings(),
                    configService.getAppSettings()
                ]);
                setOrgSettings(orgData);
                setAppSettings(appData);
            } catch (fallbackError) {
                console.error('❌ Even fallback failed:', fallbackError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const testConnection = async (): Promise<boolean> => {
        return await configService.testFirebaseConnection();
    };

    const refetch = async () => {
        configService.invalidateCache();
        await fetchSettings();
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const unsubscribe = configService.subscribeOrgSettings(
            (data) => {
                setOrgSettings(data);
            },
            (err) => {
                console.error('âŒ Org settings realtime error:', err);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Debug: Log des changements d'état
    useEffect(() => {
    }, [orgSettings, appSettings, isLoading, error]);

    return (
        <ConfigContext.Provider value={{
            orgSettings,
            appSettings,
            isLoading,
            error,
            refetch,
            testConnection
        }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
