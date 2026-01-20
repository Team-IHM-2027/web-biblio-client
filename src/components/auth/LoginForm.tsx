import React, { useState, useCallback } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { LoginFormData, FormErrors } from '../../types/auth';
import { authService } from '../../services/auth/authService';

// Import des composants UI
import Input from '../ui/Input';
import Button from '../ui/Button';

// Import des icônes
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    BookOpen
} from 'lucide-react';

interface LoginFormProps {
    onSuccess: () => void;
    onSwitchToRegister: () => void;
    onForgotPassword: (email: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
                                                 onSuccess,
                                                 onSwitchToRegister,
                                                 onForgotPassword
                                             }) => {
    const { orgSettings } = useConfig();
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    // États du formulaire
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Validation du formulaire
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'L\'email est requis';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Format d\'email invalide';
        }

        // Validation du mot de passe
        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Gestion des changements de champs
    const handleInputChange = (field: keyof LoginFormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = field === 'rememberMe' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Nettoyer l'erreur du champ modifié
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await authService.signIn(formData);

            if (response.success) {
                onSuccess();
            } else {
                // Show clear error message for blocked users
                const errorMessage = response.message || 'Erreur lors de la connexion';
                
                if (errorMessage.includes('bloqué') || errorMessage.includes('Violation')) {
                  setErrors({ general: errorMessage });
                } else {
                  setErrors({ general: errorMessage });
                }
            }
        } catch {
            setErrors({ general: 'Une erreur inattendue s\'est produite' });
        } finally {
            setLoading(false);
        }
    };

    // Gestion du mot de passe oublié
    const handleForgotPassword = () => {
        if (formData.email) {
            onForgotPassword(formData.email);
        } else {
            setErrors({ email: 'Veuillez saisir votre email pour réinitialiser votre mot de passe' });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                >
                    <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold" style={{ color: secondaryColor }}>
                    Connexion
                </h1>
                <p className="text-gray-600 mt-2">
                    Accédez à votre compte {organizationName}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Erreur générale */}
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Champ email */}
                <Input
                    label="Adresse email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    leftIcon={<Mail className="h-5 w-5" />}
                    autoComplete="email"
                    required
                />

                {/* Champ mot de passe */}
                <Input
                    label="Mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    leftIcon={<Lock className="h-5 w-5" />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5 cursor-pointer" /> : <Eye className="h-5 w-5" />}
                        </button>
                    }
                    autoComplete="current-password"
                    required
                />

                {/* Options supplémentaires */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.rememberMe}
                            onChange={handleInputChange('rememberMe')}
                            className="h-4 w-4 rounded cursor-pointer border-gray-300 focus:ring-2 transition-colors"
                            style={{
                                color:`${primaryColor}30`
                            }}
                        />
                        <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm font-medium hover:underline transition-colors"
                        style={{ color: primaryColor }}
                    >
                        Mot de passe oublié ?
                    </button>
                </div>

                {/* Bouton de connexion */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="cursor-pointer"
                    leftIcon={<LogIn className="h-5 w-5" />}
                >
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>

                {/* Séparateur */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Nouveau sur {organizationName} ?
            </span>
                    </div>
                </div>

                {/* Bouton d'inscription */}
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                    className="cursor-pointer"
                    onClick={onSwitchToRegister}
                >
                    Créer un compte
                </Button>
            </form>

            {/* Informations supplémentaires */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Première visite ?</h3>
                <p className="text-sm text-gray-600 mb-3">
                    Créez votre compte pour accéder à notre catalogue complet et profiter de tous nos services.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                        <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: primaryColor }}
                        ></div>
                        Accès à plus de 500 livres
                    </li>
                    <li className="flex items-center">
                        <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: primaryColor }}
                        ></div>
                        Réservation en ligne
                    </li>
                    <li className="flex items-center">
                        <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: primaryColor }}
                        ></div>
                        Recommandations personnalisées
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default LoginForm;
