interface CloudinaryConfig {
    cloudName: string;
    uploadPreset: string;
    apiKey?: string;
}

interface UploadOptions {
    folder?: string;
    publicId?: string;
    quality?: 'auto' | 'auto:good' | 'auto:best' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
    maxFileSize?: number;
    allowedFormats?: string[];
    tags?: string[];
    context?: Record<string, string>;
}

interface UploadResponse {
    success: boolean;
    url?: string;
    publicId?: string;
    error?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
}

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

class CloudinaryService {
    private config: CloudinaryConfig;

    constructor(config: CloudinaryConfig) {
        this.config = config;
    }

    /**
     * Upload d'image pour avatar/profil
     * Les transformations seront appliquées via l'upload preset
     */
    async uploadAvatar(
        file: File,
        userId: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResponse> {
        const options: UploadOptions = {
            folder: 'avatars',
            publicId: `avatar_${userId}_${Date.now()}`,
            // ✅ Les transformations sont définies dans l'upload preset
            quality: 'auto:good',
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            tags: ['avatar', 'profile']
        };

        return this.uploadImage(file, options, onProgress);
    }

    /**
     * Upload d'image pour couverture de livre
     */
    async uploadBookCover(
        file: File,
        bookId: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResponse> {
        const options: UploadOptions = {
            folder: 'book-covers',
            publicId: `book_${bookId}_${Date.now()}`,
            // ✅ Les transformations sont définies dans l'upload preset
            quality: 'auto:best',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            tags: ['book', 'cover']
        };

        return this.uploadImage(file, options, onProgress);
    }

    /**
     * Upload d'image générale
     */
    async uploadGeneral(
        file: File,
        folder: string = 'general',
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResponse> {
        const options: UploadOptions = {
            folder,
            publicId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            quality: 'auto',
            maxFileSize: 15 * 1024 * 1024, // 15MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            tags: ['general', 'upload']
        };

        return this.uploadImage(file, options, onProgress);
    }

    /**
     * Upload d'image avec drag & drop
     */
    async uploadDragDrop(
        file: File,
        folder: string = 'uploads',
        customOptions: Partial<UploadOptions> = {},
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResponse> {
        const options: UploadOptions = {
            folder,
            publicId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            quality: 'auto',
            maxFileSize: 20 * 1024 * 1024, // 20MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            tags: ['dragdrop', 'upload'],
            ...customOptions
        };

        return this.uploadImage(file, options, onProgress);
    }

    /**
     * Méthode générique d'upload (CORRIGÉE)
     */
    private async uploadImage(
        file: File,
        options: UploadOptions,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<UploadResponse> {
        try {
            // Validation du fichier
            const validation = this.validateFile(file, options);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Création du FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.config.uploadPreset);

            // Logging upload details for debugging
            console.log('📤 Cloudinary Upload Details:');
            console.log('☁️ Cloud Name:', this.config.cloudName);
            console.log('🎁 Upload Preset:', this.config.uploadPreset);
            console.log('📁 Folder:', options.folder);
            console.log('🆔 Public ID:', options.publicId);

            // ✅ Paramètres autorisés pour unsigned upload
            if (options.folder) {
                formData.append('folder', options.folder);
            }

            if (options.publicId) {
                formData.append('public_id', options.publicId);
            }

            if (options.tags && options.tags.length > 0) {
                formData.append('tags', options.tags.join(','));
            }

            if (options.context) {
                formData.append('context', Object.entries(options.context)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('|')
                );
            }

            // ❌ SUPPRIMÉ: transformation (cause de l'erreur)
            // ✅ Les transformations doivent être configurées dans l'upload preset

            console.log('📤 Upload vers Cloudinary...');
            console.log('📁 Folder:', options.folder);
            console.log('🆔 Public ID:', options.publicId);
            console.log('🏷️ Tags:', options.tags);

            // URL d'upload Cloudinary
            const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;

            // Upload avec XMLHttpRequest pour suivre le progrès
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();

                // Suivi du progrès
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100)
                            };
                            onProgress(progress);
                        }
                    });
                }

                // Gestion de la réponse
                xhr.addEventListener('load', () => {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (xhr.status === 200 && response.secure_url) {
                            console.log('✅ Upload réussi:', response.secure_url);
                            resolve({
                                success: true,
                                url: response.secure_url,
                                publicId: response.public_id,
                                width: response.width,
                                height: response.height,
                                format: response.format,
                                bytes: response.bytes
                            });
                        } else {
                            console.error('❌ Cloudinary Error Response:', response);
                            console.error('❌ Status Code:', xhr.status);
                            console.log('ℹ️ Check if VITE_CLOUDINARY_UPLOAD_PRESET matches your Cloudinary dashboard preset name.');
                            resolve({
                                success: false,
                                error: response.error?.message || 'Erreur lors de l\'upload'
                            });
                        }
                    } catch (error) {
                        console.error('❌ Erreur traitement Cloudinary:', error);
                        resolve({
                            success: false,
                            error: 'Erreur lors du traitement de la réponse'
                        });
                    }
                });

                // Gestion des erreurs
                xhr.addEventListener('error', () => {
                    console.error('❌ Erreur réseau Cloudinary');
                    resolve({
                        success: false,
                        error: 'Erreur de connexion lors de l\'upload'
                    });
                });

                // Timeout
                xhr.addEventListener('timeout', () => {
                    console.error('❌ Timeout Cloudinary');
                    resolve({
                        success: false,
                        error: 'Timeout lors de l\'upload'
                    });
                });

                // Configuration et envoi
                xhr.open('POST', uploadUrl);
                xhr.timeout = 60000; // 60 secondes
                xhr.send(formData);
            });

        } catch (error) {
            console.error('❌ Erreur upload Cloudinary:', error);
            return {
                success: false,
                error: 'Erreur inattendue lors de l\'upload'
            };
        }
    }

    /**
     * Validation du fichier
     */
    private validateFile(file: File, options: UploadOptions): { isValid: boolean; error?: string } {
        // Vérification de la taille
        if (options.maxFileSize && file.size > options.maxFileSize) {
            const maxSizeMB = Math.round(options.maxFileSize / (1024 * 1024));
            return {
                isValid: false,
                error: `La taille du fichier ne doit pas dépasser ${maxSizeMB}MB`
            };
        }

        // Vérification du format
        if (options.allowedFormats) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const fileType = file.type.split('/')[1];

            const isValidFormat = options.allowedFormats.some(format =>
                format === fileExtension || format === fileType
            );

            if (!isValidFormat) {
                return {
                    isValid: false,
                    error: `Format non autorisé. Formats acceptés: ${options.allowedFormats.join(', ')}`
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Génération d'URL avec transformations (à utiliser APRÈS l'upload)
     */
    generateUrl(publicId: string, transformations: string = ''): string {
        const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;

        if (transformations) {
            return `${baseUrl}/${transformations}/${publicId}`;
        }

        return `${baseUrl}/${publicId}`;
    }

    /**
     * Optimisation d'URL pour différentes tailles (à utiliser APRÈS l'upload)
     */
    getOptimizedUrl(publicId: string, size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' = 'medium'): string {
        const transformations: Record<string, string> = {
            thumbnail: 'c_fill,w_100,h_100,q_auto,f_auto',
            small: 'c_fill,w_300,h_300,q_auto,f_auto',
            medium: 'c_fill,w_600,h_600,q_auto,f_auto',
            large: 'c_fill,w_1200,h_1200,q_auto,f_auto',
            original: 'q_auto,f_auto'
        };

        return this.generateUrl(publicId, transformations[size]);
    }
}

// Configuration par défaut
const defaultConfig: CloudinaryConfig = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset'
};

export const cloudinaryService = new CloudinaryService(defaultConfig);
export { CloudinaryService, type UploadResponse, type UploadProgress, type UploadOptions };
