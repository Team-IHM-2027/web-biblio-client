import { useConfig } from '../../contexts/ConfigContext.tsx';
import { configService } from '../../services/configService.ts';
import { Mail, Phone, Facebook, Instagram, Clock, MapPin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { orgSettings, isLoading } = useConfig();

    if (isLoading) {
        return (
            <footer className="bg-gray-800 text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-700 rounded"></div>
                                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-6 bg-gray-700 rounded w-2/3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    // Générer les horaires d'ouverture pour la semaine
    const getWeekSchedule = () => {
        if (!orgSettings?.OpeningHours) return [];

        const days = [
            { key: 'Monday', label: 'Lundi' },
            { key: 'Tuesday', label: 'Mardi' },
            { key: 'Wednesday', label: 'Mercredi' },
            { key: 'Thursday', label: 'Jeudi' },
            { key: 'Friday', label: 'Vendredi' },
            { key: 'Saturday', label: 'Samedi' },
            { key: 'Sunday', label: 'Dimanche' }
        ];

        return days.map(day => ({
            ...day,
            hours: configService.formatOpeningHours(orgSettings.OpeningHours[day.key as keyof typeof orgSettings.OpeningHours])
        }));
    };

    const weekSchedule = getWeekSchedule();

    return (
        <footer
            className="text-white py-12"
            style={{ backgroundColor: '#222449' }}
        >
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Informations de l'organisation */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            {orgSettings?.Logo && (
                                <img
                                    src={orgSettings.Logo}
                                    alt={orgSettings.Name}
                                    className="h-12 w-12 object-contain"
                                />
                            )}
                            <h3 className="text-xl font-bold">{orgSettings?.Name || 'BiblioENSPY'}</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                            Votre bibliothèque en ligne accessible à tout moment pour réserver et emprunter des livres.
                        </p>

                        {/* Réseaux sociaux */}
                        <div className="flex space-x-4 mt-4">
                            {orgSettings?.Contact.Facebook && (
                                <a
                                    href={orgSettings.Contact.Facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
                                    style={{ color: primaryColor }}
                                >
                                    <Facebook size={20} />
                                </a>
                            )}
                            {orgSettings?.Contact.Instagram && (
                                <a
                                    href={orgSettings.Contact.Instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors"
                                    style={{ color: primaryColor }}
                                >
                                    <Instagram size={20} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Liens rapides */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Liens rapides</h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="/catalogue"
                                    className="text-gray-300 transition-colors"
                                    style={{ '--hover-color': primaryColor } as React.CSSProperties}
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                >
                                    Catalogue
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/dashboard/cart"
                                    className="text-gray-300 transition-colors"
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                >
                                    Mes réservations
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/dashboard/emprunts"
                                    className="text-gray-300 transition-colors"
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                >
                                    Mes reservations
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/aide"
                                    className="text-gray-300 transition-colors"
                                    onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                >
                                    Aide & Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contact</h3>
                        <div className="space-y-3">
                            {/* Adresse */}
                            {orgSettings?.Address && (
                                <div className="flex items-start space-x-3">
                                    <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                                    <div>
                                        <p className="text-gray-300 text-sm">{orgSettings.Address}</p>
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            {orgSettings?.Contact.Email && (
                                <div className="flex items-center space-x-3">
                                    <Mail size={18} style={{ color: primaryColor }} />
                                    <a
                                        href={`mailto:${orgSettings.Contact.Email}`}
                                        className="text-gray-300 text-sm hover:underline transition-colors"
                                        onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                    >
                                        {orgSettings.Contact.Email}
                                    </a>
                                </div>
                            )}

                            {/* Téléphone */}
                            {orgSettings?.Contact.Phone && (
                                <div className="flex items-center space-x-3">
                                    <Phone size={18} style={{ color: primaryColor }} />
                                    <a
                                        href={`tel:${orgSettings.Contact.Phone}`}
                                        className="text-gray-300 text-sm hover:underline transition-colors"
                                        onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                                    >
                                        {orgSettings.Contact.Phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Horaires d'ouverture */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <Clock size={18} className="mr-2" style={{ color: primaryColor }} />
                            Horaires d'ouverture
                        </h3>
                        <div className="space-y-2">
                            {weekSchedule.map(day => (
                                <div key={day.key} className="flex justify-between text-sm">
                                    <span className="text-gray-300">{day.label}</span>
                                    <span
                                        className={`font-medium ${day.hours === 'Fermé' ? 'text-red-400' : 'text-green-400'}`}
                                    >
                    {day.hours}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Séparateur et copyright */}
                <div
                    className="border-t mt-8 pt-6 text-center"
                    style={{ borderColor: `${primaryColor}40` }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            &copy; {currentYear} {orgSettings?.Name || 'BiblioENSPY'}. Tous droits réservés.
                        </p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a
                                href="/privacy"
                                className="text-gray-400 text-sm hover:underline transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                Politique de confidentialité
                            </a>
                            <a
                                href="/terms"
                                className="text-gray-400 text-sm hover:underline transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                Conditions d'utilisation
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
