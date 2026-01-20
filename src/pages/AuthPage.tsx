// src/pages/AuthPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../configs/firebase';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import EmailVerification from '../components/auth/EmailVerification';
import { authService } from '../services/auth/authService';
import BlockingAlert from '../components/auth/BlockingAlert';

type AuthMode = 'login' | 'register' | 'verify-email' | 'reset-password';

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<AuthMode>('login');
    const [emailToVerify, setEmailToVerify] = useState<string>('');
    const [_checkingVerification, setCheckingVerification] = useState(false);
    const [showBlockingAlert, setShowBlockingAlert] = useState(false);
    const [blockingReason, setBlockingReason] = useState('');

    // Check if user is already verified and logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.emailVerified) {
                // Check for blocking status
                const blockStatus = localStorage.getItem('userBlockStatus');
                if (blockStatus) {
                    const parsed = JSON.parse(blockStatus);
                    if (parsed.isBlocked) {
                        setBlockingReason(parsed.reason);
                        setShowBlockingAlert(true);
                        return;
                    }
                }

                // Get the intended destination from location state, or default to home
                const intendedPath = location.state?.from?.pathname || '/';
                
                // Only redirect if we came from the auth page itself
                if (location.pathname === '/auth') {
                    navigate(intendedPath, { replace: true });
                }
            }
        });

        return unsubscribe;
    }, [navigate, location]);

    // Gestion du succès de connexion
    const handleLoginSuccess = () => {
        // Check for blocking status
        const blockStatus = localStorage.getItem('userBlockStatus');
        if (blockStatus) {
            const parsed = JSON.parse(blockStatus);
            if (parsed.isBlocked) {
                setBlockingReason(parsed.reason);
                setShowBlockingAlert(true);
                return;
            }
        }

        // Get the intended destination from location state, or default to home
        const intendedPath = location.state?.from?.pathname || '/';
        navigate(intendedPath, { replace: true });
    };

    // Gestion du succès d'inscription
    const handleRegisterSuccess = (email: string) => {
        setEmailToVerify(email);
        setMode('verify-email');
    };

    // Gestion du renvoi d'email de vérification
    const handleResendVerificationEmail = async () => {
        try {
            setCheckingVerification(true);
            await authService.sendEmailVerification();
        } catch (error) {
            console.error('❌ Erreur renvoi email:', error);
            throw error;
        } finally {
            setCheckingVerification(false);
        }
    };

    // Gestion du retour à la connexion
    const handleBackToLogin = () => {
        setMode('login');
        setEmailToVerify('');
    };

    // Gestion du mot de passe oublié
    const handleForgotPassword = async (email: string) => {
        try {
            await authService.resetPassword(email);
        } catch (error) {
            console.error('❌ Erreur reset password:', error);
        }
    };

    return (
        <div className="min-h-screen">
            {mode === 'login' && (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <LoginForm
                        onSuccess={handleLoginSuccess}
                        onSwitchToRegister={() => setMode('register')}
                        onForgotPassword={handleForgotPassword}
                    />
                </div>
            )}

            {mode === 'register' && (
                <RegisterForm
                    onSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => setMode('login')}
                />
            )}

            {mode === 'verify-email' && (
                <EmailVerification
                    email={emailToVerify}
                    onResendEmail={handleResendVerificationEmail}
                    onBackToLogin={handleBackToLogin}
                />
            )}

            {/* Blocking Alert */}
            <BlockingAlert
                isOpen={showBlockingAlert}
                reason={blockingReason}
                onClose={() => {
                    setShowBlockingAlert(false);
                    navigate('/', { replace: true });
                }}
            />
        </div>
    );
};

export default AuthPage;