import React from 'react';
import { Clock, Calendar, AlertTriangle, BookOpen, Users, Shield, Info, CheckCircle, XCircle } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Types pour les horaires d'ouverture
interface OpeningHours {
    open: string;
    close: string;
}

// Type pour React Component avec icône
type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: number }>;

// Props pour DaySchedule
interface DayScheduleProps {
    day: string;
    hours: OpeningHours;
    isToday?: boolean;
    primaryColor: string;
}

// Props pour PolicyCard
interface PolicyCardProps {
    icon: IconComponent;
    title: string;
    items: string[];
    color: string;
}

// Type pour les jours de la semaine
type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

const LibrarySchedule: React.FC = () => {
    const { orgSettings, isLoading } = useConfig();

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    // Fonction pour parser les horaires
    const parseOpeningHours = (dayString: string): OpeningHours => {
        try {
            return JSON.parse(dayString) as OpeningHours;
        } catch {
            return { open: "closed", close: "closed" };
        }
    };

    // Fonction pour formater les horaires
    const formatOpeningHours = (hours: OpeningHours): string => {
        if (hours.open === "closed") {
            return "Fermé";
        }
        return `${hours.open} - ${hours.close}`;
    };

    // Obtenir le jour actuel
    const getCurrentDay = (): WeekDay => {
        const days: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    // Vérifier si la bibliothèque est ouverte maintenant
    const isOpenNow = (): boolean => {
        if (!orgSettings?.OpeningHours) return false;

        const today = getCurrentDay();
        const todayHours = parseOpeningHours(orgSettings.OpeningHours[today]);

        if (todayHours.open === "closed") return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [openHour, openMin] = todayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;

        return currentTime >= openTime && currentTime <= closeTime;
    };

    const DaySchedule: React.FC<DayScheduleProps> = ({ day, hours, isToday = false, primaryColor }) => {
        const isOpen = hours.open !== "closed";

        return (
            <div
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    isToday
                        ? 'shadow-lg transform scale-105'
                        : 'hover:shadow-md'
                }`}
                style={{
                    backgroundColor: isToday ? `${primaryColor}10` : 'white',
                    border: isToday ? `2px solid ${primaryColor}` : '1px solid #e5e7eb'
                }}
            >
                <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                    <span className={`font-medium ${isToday ? 'font-bold' : ''}`} style={{ color: isToday ? primaryColor : '#374151' }}>
            {day}
                        {isToday && <span className="ml-2 text-xs px-2 py-1 rounded-full bg-current text-white opacity-80">Aujourd'hui</span>}
          </span>
                </div>

                <div className="flex items-center">
                    {isOpen ? (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            <span className="font-medium text-gray-700">{formatOpeningHours(hours)}</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                            <span className="font-medium text-red-600">Fermé</span>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const PolicyCard: React.FC<PolicyCardProps> = ({ icon: Icon, title, items, color }) => (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>

            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <div
                            className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                            style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-gray-600 leading-relaxed">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

    if (isLoading) {
        return (
            <section
                className="py-20"
                style={{ backgroundColor: `${secondaryColor}03` }}
            >
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <LoadingSpinner
                            size="lg"
                            text="Chargement des informations..."
                        />
                    </div>
                </div>
            </section>
        );
    }

    if (!orgSettings) {
        return (
            <section
                className="py-20"
                style={{ backgroundColor: `${secondaryColor}03` }}
            >
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Configuration non disponible</h3>
                        <p className="text-gray-600">Impossible de charger les informations de la bibliothèque.</p>
                    </div>
                </div>
            </section>
        );
    }

    const daysOrder: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayLabels: Record<WeekDay, string> = {
        Monday: 'Lundi',
        Tuesday: 'Mardi',
        Wednesday: 'Mercredi',
        Thursday: 'Jeudi',
        Friday: 'Vendredi',
        Saturday: 'Samedi',
        Sunday: 'Dimanche'
    };

    const currentDay = getCurrentDay();
    const isCurrentlyOpen = isOpenNow();

    // Règles d'emprunt avec limite dynamique
    const borrowingRules = [
        `Maximum ${orgSettings.MaximumSimultaneousLoans} livre${orgSettings.MaximumSimultaneousLoans > 1 ? 's' : ''} simultanément`,
        ...(orgSettings.SpecificBorrowingRules || [])
    ];

    // Règles générales par défaut
    const generalRules = [
        "Respect du silence dans les espaces d'étude",
        "Interdiction de consommer nourriture et boissons",
        "Usage des téléphones en mode silencieux uniquement",
        "Signalement obligatoire de tout dommage",
        "Respect du matériel et des autres utilisateurs"
    ];

    return (
        <section
            className="py-20"
            style={{ backgroundColor: `${secondaryColor}15` }}
        >
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

                    <h2 className="text-4xl font-bold mb-6" style={{ color: secondaryColor }}>
                        Horaires & Politiques
                    </h2>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Consultez nos horaires d'ouverture et prenez connaissance de nos règles
                        d'utilisation pour une expérience optimale à {organizationName}.
                    </p>
                </div>

                {/* Status actuel */}
                <div className="text-center mb-12">
                    <div
                        className={`inline-flex items-center px-6 py-3 rounded-full font-semibold text-lg ${
                            isCurrentlyOpen
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                    >
                        {isCurrentlyOpen ? (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Bibliothèque actuellement ouverte
                            </>
                        ) : (
                            <>
                                <Clock className="w-5 h-5 mr-2" />
                                Bibliothèque actuellement fermée
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Horaires d'ouverture */}
                    <div>
                        <div className="flex items-center mb-8">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <Clock className="w-6 h-6" style={{ color: primaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                                    Horaires d'Ouverture
                                </h3>
                                <p className="text-gray-600">Planning hebdomadaire de la bibliothèque</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {daysOrder.map((day) => (
                                <DaySchedule
                                    key={day}
                                    day={dayLabels[day]}
                                    hours={parseOpeningHours(orgSettings.OpeningHours[day])}
                                    isToday={day === currentDay}
                                    primaryColor={primaryColor}
                                />
                            ))}
                        </div>

                        {/* Informations supplémentaires */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center mb-2">
                                <Info className="w-5 h-5 mr-2 text-blue-600" />
                                <h4 className="font-semibold text-blue-800">Informations pratiques</h4>
                            </div>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Accès en ligne disponible 24h/24, 7j/7</li>
                                <li>• Réservations possibles en dehors des heures d'ouverture</li>
                                <li>• Service d'aide en ligne pendant les heures d'ouverture</li>
                                <li>• Fermeture exceptionnelle lors des jours fériés</li>
                            </ul>
                        </div>
                    </div>

                    {/* Politiques et règles */}
                    <div>
                        <div className="flex items-center mb-8">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                                style={{ backgroundColor: `${secondaryColor}15` }}
                            >
                                <Shield className="w-6 h-6" style={{ color: secondaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: secondaryColor }}>
                                    Règlement & Politiques
                                </h3>
                                <p className="text-gray-600">Conditions d'utilisation de nos services</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Règles d'emprunt */}
                            <PolicyCard
                                icon={BookOpen}
                                title="Règles d'Emprunt"
                                items={borrowingRules}
                                color={primaryColor}
                            />

                            {/* Sanctions et pénalités */}
                            {orgSettings.LateReturnPenalties && orgSettings.LateReturnPenalties.length > 0 && (
                                <PolicyCard
                                    icon={AlertTriangle}
                                    title="Sanctions & Pénalités"
                                    items={orgSettings.LateReturnPenalties}
                                    color="#ef4444"
                                />
                            )}

                            {/* Règles générales */}
                            <PolicyCard
                                icon={Users}
                                title="Règles Générales"
                                items={generalRules}
                                color={secondaryColor}
                            />
                        </div>
                    </div>
                </div>

                {/* Section Contact pour questions */}
                {/* <div className="mt-16">
                    <div
                        className="rounded-2xl p-8 text-center"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`
                        }}
                    >
                        <h3 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                            Questions sur nos Politiques ?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Notre équipe est disponible pour répondre à toutes vos questions
                            concernant l'utilisation de la bibliothèque et ses services.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/contact"
                                className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Nous contacter
                            </a>
                            <a
                                href="/faq"
                                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105 border-2"
                                style={{
                                    borderColor: secondaryColor,
                                    color: secondaryColor
                                }}
                            >
                                FAQ
                            </a>
                        </div>
                    </div>
                </div> */}
            </div>
        </section>
    );
};

export default LibrarySchedule;
