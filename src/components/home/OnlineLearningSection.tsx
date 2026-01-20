import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Clock, Award, BookOpen, Play } from 'lucide-react';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { useConfig } from '../../contexts/ConfigContext';

// Types pour les plateformes d'apprentissage
interface BiblioWeb {
    id: string;
    cathegorie?: string;
    chemin: string;
    desc?: string;
    image?: string;
    name: string;
    isActive?: boolean; // Ajout d'un champ optionnel pour la visibilité
}

// Type pour React Component avec icône
type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: number }>;

// Props pour PlatformCard
interface PlatformCardProps {
    platform: BiblioWeb;
    primaryColor: string;
    secondaryColor: string;
}

// Props pour FeatureCard
interface FeatureCardProps {
    icon: IconComponent;
    title: string;
    description: string;
    color: string;
}

const OnlineLearningSection: React.FC = () => {
    const { orgSettings } = useConfig();

    const [learningPlatforms, setLearningPlatforms] = useState<BiblioWeb[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    useEffect(() => {
        const fetchLearningPlatforms = async (): Promise<void> => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Fetching learning platforms from Firebase...');
                
                // Créer une requête avec éventuellement un filtre pour les plateformes actives
                let platformsQuery;
                
                // Option 1: Si vous avez un champ 'isActive' ou 'visible'
                try {
                    platformsQuery = query(
                        collection(db, 'OnlineCourses'),
                        // where('isActive', '==', true), // Décommentez si vous avez ce champ
                        limit(12)
                    );
                } catch (queryError) {
                    // Si la requête avec where échoue, essayez sans
                    console.log('Trying query without where clause...');
                    platformsQuery = query(
                        collection(db, 'OnlineCourses'),
                        limit(12)
                    );
                }

                const platformsSnapshot = await getDocs(platformsQuery);
                
                console.log(`Found ${platformsSnapshot.size} documents in BiblioWeb collection`);
                
                const platformsData: BiblioWeb[] = [];
                
                platformsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log(`Document ${doc.id}:`, data);
                    
                    // Validation des données
                    if (data && (data.name || data.chemin)) {
                        platformsData.push({
                            id: doc.id,
                            cathegorie: data.cathegorie || data.category || '',
                            chemin: data.chemin || data.url || data.link || '',
                            desc: data.desc || data.description || '',
                            image: data.image || data.logo || data.imageUrl || '',
                            name: data.name || data.title || 'Sans nom',
                            isActive: data.isActive !== false // Par défaut actif si non spécifié
                        });
                    }
                });

                console.log(`Processed ${platformsData.length} valid platforms`);
                
                if (platformsData.length === 0) {
                    console.warn('No valid platform data found. Check Firebase structure.');
                    setError('Aucune donnée valide trouvée dans la collection BiblioWeb');
                }

                setLearningPlatforms(platformsData);
            } catch (error) {
                console.error('Erreur lors du chargement des plateformes:', error);
                setError(`Erreur de chargement: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchLearningPlatforms();
    }, []);

    const PlatformCard: React.FC<PlatformCardProps> = ({ platform, primaryColor, secondaryColor }) => {
        const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            
            // Afficher le fallback
            const container = target.parentElement;
            if (container) {
                const fallback = container.querySelector('.image-fallback') as HTMLElement;
                if (fallback) {
                    fallback.style.display = 'flex';
                }
            }
        };

        const getCategoryDisplayName = (category: string | undefined): string => {
            if (!category || category.trim().length === 0) {
                return 'Général';
            }

            const categoryMap: Record<string, string> = {
                'gc': 'Génie Civil',
                'info': 'Informatique',
                'ge': 'Génie Électrique',
                'gm': 'Génie Mécanique',
                'general': 'Général',
                'genie-civil': 'Génie Civil',
                'informatique': 'Informatique',
                'genie-electrique': 'Génie Électrique',
                'genie-mecanique': 'Génie Mécanique'
            };
            
            const normalizedCategory = category.toLowerCase().trim();
            return categoryMap[normalizedCategory] || category;
        };

        // Validation de l'URL
        const isValidUrl = (url: string): boolean => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };

        // Nettoyer l'URL si nécessaire
        const cleanUrl = platform.chemin?.trim() || '';
        const hasValidUrl = isValidUrl(cleanUrl);

        return (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 group">
                {/* Header with logo */}
                <div className="p-6 pb-4">
                    <div className="flex items-center mb-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md mr-4 bg-gray-100 flex items-center justify-center">
                            {platform.image && platform.image.trim() ? (
                                <img
                                    src={platform.image}
                                    alt={platform.name}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                />
                            ) : null}
                            <div
                                className="image-fallback w-full h-full flex items-center justify-center"
                                style={{ display: platform.image && platform.image.trim() ? 'none' : 'flex' }}
                            >
                                <Globe className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0"> {/* Added min-w-0 for text truncation */}
                            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{platform.name}</h3>
                            <div className="flex flex-col gap-2">
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-medium w-fit"
                                    style={{
                                        backgroundColor: `${primaryColor}15`,
                                        color: primaryColor
                                    }}
                                >
                                    Plateforme d'apprentissage
                                </span>
                                {platform.cathegorie && platform.cathegorie.trim().length > 0 && (
                                    <span
                                        className="inline-block px-3 py-1 rounded-full text-xs font-medium w-fit"
                                        style={{
                                            backgroundColor: `${secondaryColor}15`,
                                            color: secondaryColor
                                        }}
                                    >
                                        {getCategoryDisplayName(platform.cathegorie)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-4 min-h-[60px]"> {/* Added min-height */}
                        {platform.desc && platform.desc.trim().length > 0
                            ? platform.desc
                            : `Plateforme d'apprentissage en ligne pour développer vos compétences avec des cours et certifications professionnelles${platform.cathegorie ? ` dans le domaine ${getCategoryDisplayName(platform.cathegorie)}` : ''}.`
                        }
                    </p>
                </div>

                {/* Platform features */}
                <div className="px-6 pb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Cours en ligne
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            ✓ Certifications
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            ✓ Accès direct
                        </span>
                    </div>
                </div>

                {/* Action button */}
                <div className="px-6 pb-6">
                    {hasValidUrl ? (
                        <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105 group-hover:shadow-lg"
                            style={{
                                backgroundColor: primaryColor,
                                color: 'white'
                            }}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Accéder à la plateforme
                        </a>
                    ) : (
                        <button
                            disabled
                            className="w-full flex items-center justify-center py-3 rounded-xl font-medium opacity-50 cursor-not-allowed"
                            style={{
                                backgroundColor: '#ccc',
                                color: 'white'
                            }}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            URL non valide
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color }) => (
        <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow duration-300">
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );

    const LoadingSkeleton: React.FC = () => (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
                <div className="flex items-start mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse mr-4"></div>
                    <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                </div>
                <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
                <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
        </div>
    );

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-1 rounded-full"
                            style={{
                                background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
                            }}
                        />
                    </div>

                    <span
                        className="inline-block py-2 px-4 rounded-full text-sm font-bold mb-4"
                        style={{
                            backgroundColor: `${primaryColor}10`,
                            color: primaryColor
                        }}
                    >
                        Formation & Certification
                    </span>

                    <h2 className="text-4xl font-bold mb-6" style={{ color: secondaryColor }}>
                        Plateformes d'Apprentissage en Ligne
                    </h2>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Complétez votre formation académique avec ces plateformes
                        d'apprentissage en ligne recommandées par notre équipe pédagogique de {organizationName}.
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.205 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800">Erreur de chargement</h4>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {/* Features highlights */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    <FeatureCard
                        icon={Globe}
                        title="Accès Global"
                        description="Apprenez depuis n'importe où dans le monde"
                        color={primaryColor}
                    />

                    <FeatureCard
                        icon={Award}
                        title="Certifications"
                        description="Obtenez des certificats reconnus mondialement"
                        color={secondaryColor}
                    />

                    <FeatureCard
                        icon={Clock}
                        title="Flexibilité"
                        description="Apprenez à votre propre rythme"
                        color={primaryColor}
                    />

                    <FeatureCard
                        icon={BookOpen}
                        title="Variété de Cours"
                        description="Explorez tous les domaines d'apprentissage"
                        color={secondaryColor}
                    />
                </div>

                {/* Platforms Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <LoadingSkeleton key={i} />
                        ))}
                    </div>
                ) : learningPlatforms.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            {learningPlatforms.slice(0, 6).map((platform) => (
                                <PlatformCard 
                                    key={platform.id} 
                                    platform={platform}
                                    primaryColor={primaryColor}
                                    secondaryColor={secondaryColor}
                                />
                            ))}
                        </div>

                        {learningPlatforms.length > 6 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {learningPlatforms.slice(6, 12).map((platform) => (
                                    <PlatformCard 
                                        key={platform.id} 
                                        platform={platform}
                                        primaryColor={primaryColor}
                                        secondaryColor={secondaryColor}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : !error ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune plateforme trouvée</h3>
                        <p className="text-gray-600">Les plateformes d'apprentissage seront affichées ici une fois ajoutées à la collection BiblioWeb.</p>

                        {/* Debug info */}
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg inline-block">
                            <p className="text-sm text-gray-600">
                                Collection: <code className="bg-gray-200 px-2 py-1 rounded">BiblioWeb</code>
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <div
                        className="inline-block p-8 rounded-2xl shadow-xl"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`
                        }}
                    >
                        <h3 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                            Enrichissez Votre Parcours Académique
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Ces plateformes d'apprentissage en ligne vous offrent l'opportunité de développer
                            de nouvelles compétences et d'obtenir des certifications reconnues dans le monde entier.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/books"
                                className="px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Explorer notre catalogue
                            </a>
                            <a
                                href="/auth"
                                className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105 border-2"
                                style={{
                                    borderColor: secondaryColor,
                                    color: secondaryColor
                                }}
                            >
                                Créer un compte
                            </a>
                        </div>
                    </div>
                </div>

                {/* Additional info */}
                <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                            <Play className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 mb-2">
                                Recommandation de notre équipe
                            </h4>
                            <p className="text-blue-800 text-sm leading-relaxed">
                                Ces plateformes d'apprentissage en ligne sont soigneusement sélectionnées pour
                                compléter votre formation académique. Elles offrent des cours de qualité, des
                                certifications reconnues et des opportunités d'apprentissage dans de nombreux domaines.
                                Combinez-les avec nos ressources physiques pour une expérience d'apprentissage complète.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OnlineLearningSection;