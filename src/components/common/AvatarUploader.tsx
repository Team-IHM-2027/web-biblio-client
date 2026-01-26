import React, { useState, useRef } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { cloudinaryService, UploadProgress } from '../../services/cloudinaryService';
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getRandomDefaultAvatar } from '../../utils/userUtils';

interface AvatarUploaderProps {
    currentAvatar?: string;
    onAvatarUploaded: (avatarUrl: string) => void;
    onAvatarRemoved?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    userName?: string;
    userId: string;
    disabled?: boolean;
    className?: string;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
    currentAvatar,
    onAvatarUploaded,
    onAvatarRemoved,
    size = 'lg',
    userName = '',
    userId,
    disabled = false,
    className = ''
}) => {
    const { orgSettings } = useConfig();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatar);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    // Tailles des avatars avec design amélioré
    const sizes = {
        sm: {
            container: 'w-16 h-16',
            text: 'text-lg',
            icon: 16,
            uploadIcon: 14,
            button: 'w-6 h-6',
            removeButton: 'w-5 h-5'
        },
        md: {
            container: 'w-24 h-24',
            text: 'text-xl',
            icon: 20,
            uploadIcon: 16,
            button: 'w-8 h-8',
            removeButton: 'w-6 h-6'
        },
        lg: {
            container: 'w-32 h-32',
            text: 'text-2xl',
            icon: 24,
            uploadIcon: 20,
            button: 'w-10 h-10',
            removeButton: 'w-7 h-7'
        },
        xl: {
            container: 'w-40 h-40',
            text: 'text-3xl',
            icon: 28,
            uploadIcon: 24,
            button: 'w-12 h-12',
            removeButton: 'w-8 h-8'
        }
    };

    const sizeConfig = sizes[size];

    // Déclencher la sélection de fichier
    const handleSelectFile = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    // Validation du fichier
    const validateFile = (file: File): string | null => {
        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            return 'Seules les images sont autorisées (JPG, PNG, WEBP)';
        }

        // Vérifier la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return 'L\'image ne doit pas dépasser 5MB';
        }

        return null;
    };

    // Gérer la sélection de fichier
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        await handleUpload(file);
        e.target.value = ''; // Reset input
    };

    // Gestion du drag & drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        const file = files[0];

        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        await handleUpload(file);
    };

    // Upload du fichier
    const handleUpload = async (file: File) => {
        setError('');
        setIsUploading(true);
        setUploadProgress(0);
        setShowSuccess(false);

        // Créer une prévisualisation locale immédiate
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        try {
            const response = await cloudinaryService.uploadAvatar(
                file,
                userId,
                (progress: UploadProgress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            // Libérer la mémoire de la prévisualisation locale
            URL.revokeObjectURL(localPreview);

            if (response.success && response.url) {
                setPreviewUrl(response.url);
                onAvatarUploaded(response.url);
                setShowSuccess(true);

                // Masquer le message de succès après 3 secondes
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setError(response.error || 'Erreur lors de l\'upload');
                setPreviewUrl(currentAvatar); // Revenir à l'avatar précédent
            }
        } catch (error) {
            console.error('Erreur upload avatar:', error);
            setError('Erreur inattendue lors de l\'upload');
            setPreviewUrl(currentAvatar);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Supprimer l'avatar
    const handleRemoveAvatar = () => {
        if (disabled) return;

        setPreviewUrl(undefined);
        setError('');
        setShowSuccess(false);

        if (onAvatarRemoved) {
            onAvatarRemoved();
        }
    };


    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Container de l'avatar avec drag & drop */}
            <div className="relative group">
                <div
                    className={`${sizeConfig.container} rounded-full overflow-hidden border-4 cursor-pointer transition-all duration-300 relative ${disabled
                        ? 'opacity-50 cursor-not-allowed border-gray-300'
                        : isDragging
                            ? 'scale-105 shadow-2xl'
                            : 'hover:scale-105 hover:shadow-xl'
                        } ${isDragging ? 'border-dashed' : 'border-solid'}`}
                    style={{
                        borderColor: disabled
                            ? '#d1d5db'
                            : isDragging
                                ? primaryColor
                                : previewUrl
                                    ? primaryColor
                                    : '#e5e7eb'
                    }}
                    onClick={handleSelectFile}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Image ou placeholder */}
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={userName || 'Avatar'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={getRandomDefaultAvatar()}
                            alt={userName || 'Avatar'}
                            className="w-full h-full object-cover opacity-50"
                        />
                    )}

                    {/* Overlay avec icône au survol */}
                    {!disabled && !isUploading && (
                        <div className={`absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center ${isDragging ? 'opacity-100' : ''}`}>
                            <div className="text-center text-white cursor-pointer">
                                <Camera
                                    size={sizeConfig.icon}
                                    className="mx-auto mb-1"
                                />
                                <span className="text-xs font-medium">
                                    {isDragging ? 'Déposez ici' : 'Changer'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Barre de progression pendant l'upload */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="rgba(255,255,255,0.3)"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke={primaryColor}
                                            strokeWidth="4"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-300"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs">Upload en cours...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bouton de suppression */}
                {previewUrl && !disabled && !isUploading && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAvatar();
                        }}
                        className={`absolute -top-2 -right-2 ${sizeConfig.removeButton} rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200 z-10`}
                    >
                        <X size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
                    </button>
                )}

                {/* Bouton d'upload flottant */}
                {!disabled && !isUploading && (
                    <button
                        onClick={handleSelectFile}
                        className={`absolute -bottom-2 -right-2 ${sizeConfig.button} rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl`}
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Upload size={sizeConfig.uploadIcon} />
                    </button>
                )}
            </div>

            {/* Instructions améliorées */}
            {!disabled && (
                <div className="text-center max-w-xs">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                        {previewUrl ? 'Cliquez pour changer' : 'Glissez-déposez ou cliquez'}
                    </p>
                    <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP • Max 5MB • Min 100x100px
                    </p>
                </div>
            )}

            {/* Message d'erreur stylisé */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-3 max-w-xs w-full">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Message de succès stylisé */}
            {showSuccess && !isUploading && !error && (
                <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-3 max-w-xs w-full animate-fadeIn">
                    <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-green-700 text-sm font-medium">
                            Photo mise à jour avec succès !
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvatarUploader;
