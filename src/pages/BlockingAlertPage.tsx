import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogOut, RefreshCcw, ShieldAlert } from 'lucide-react';
import { authService } from '../services/auth/authService';

const BlockingAlertPage: React.FC = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);
    const [blockInfo, setBlockInfo] = useState<{ reason: string; blockedAt?: string } | null>(null);

    useEffect(() => {
        const status = localStorage.getItem('userBlockStatus');
        if (status) {
            setBlockInfo(JSON.parse(status));
        }
    }, []);

    const handleLogout = async () => {
        try {
            await authService.signOut();
            localStorage.removeItem('userBlockStatus');
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/auth', { replace: true });
        }
    };

    const checkStatus = async () => {
        setIsChecking(true);
        try {
            // If user is actually still logged into Firebase but we force them here
            const user = await authService.getCurrentUser();
            if (user && user.etat !== 'bloc') {
                localStorage.removeItem('userBlockStatus');
                navigate('/', { replace: true });
            } else {
                // Still blocked or not logged in
                if (!user) {
                    navigate('/auth', { replace: true });
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setTimeout(() => setIsChecking(false), 800);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-center text-white relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert size={120} />
                        </div>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                            <AlertCircle size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold mb-2">Accès Suspendu</h1>
                        <p className="text-red-100 text-lg">Votre compte a été bloqué par l'administration</p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                        <div className="bg-red-50 rounded-xl p-6 mb-8 border border-red-100">
                            <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2">
                                <ShieldAlert size={18} />
                                Détails du blocage
                            </h3>
                            <p className="text-red-700 leading-relaxed">
                                {blockInfo?.reason || "Votre accès à la plateforme a été suspendu pour violation des règles de la bibliothèque ou comportement inapproprié."}
                            </p>
                            {blockInfo?.blockedAt && (
                                <p className="text-red-600/70 text-sm mt-4 italic">
                                    Bloqué le : {(() => {
                                        const dateInfo = blockInfo.blockedAt;
                                        let date: Date;

                                        if (dateInfo && typeof dateInfo === 'object' && 'seconds' in dateInfo) {
                                            date = new Date((dateInfo as any).seconds * 1000);
                                        } else if (typeof dateInfo === 'string') {
                                            date = new Date(dateInfo);
                                        } else {
                                            date = new Date(dateInfo as any);
                                        }

                                        return !isNaN(date.getTime())
                                            ? date.toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'Date inconnue';
                                    })()}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-600 text-center">
                                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le responsable de la bibliothèque.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={checkStatus}
                                    disabled={isChecking}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold disabled:opacity-50"
                                >
                                    <RefreshCcw size={18} className={isChecking ? "animate-spin" : ""} />
                                    {isChecking ? "Vérification..." : "Vérifier mon statut"}
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all font-semibold"
                                >
                                    <LogOut size={18} />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} Bibliothèque Numérique - Système de Sécurité
                        </p>
                    </div>
                </div>

                {/* Support Note */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Besoin d'aide ? <a href="#" className="text-red-600 font-medium hover:underline">Consulter le centre d'aide</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BlockingAlertPage;
