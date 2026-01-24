import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../configs/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { authService } from '../../services/auth/authService';
import { BiblioUser } from '../../types/auth';
import { BookOpen, User, Menu, X, LogOut, Bell, MessageCircle, History, Heart } from 'lucide-react';
import CartDropdown from "./CartDropdown";
import NotificationIcon from '../common/NotificationIcon';
import { getRandomDefaultAvatar } from '../../utils/userUtils';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { orgSettings, isLoading } = useConfig();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    const reservationCount = currentUser?.reservations?.filter(r => r.etat === 'reserver')?.length || 0;
    const unreadNotifications = currentUser?.notifications?.filter(n => !n.read)?.length || 0;
    const unreadMessages = currentUser?.messages?.filter(m => !m.lu && !m.lue)?.length || 0;
    // const totalEtat: number = orgSettings?.MaximumSimultaneousLoans || 5;

    /*    const extractTabEtatReserved = (user: BiblioUser, max: number = totalEtat): TabEtatEntry[] => {
            const reserved: TabEtatEntry[] = [];
    
            for (let i = 1; i <= max; i++) {
                const etatKey = `etat${i}` as keyof BiblioUser;
                const tabEtatKey = `tabEtat${i}` as keyof BiblioUser;
    
                if (user[etatKey] === 'reserv' && Array.isArray(user[tabEtatKey])) {
                    reserved.push(user[tabEtatKey] as TabEtatEntry);
                }
            }
    
            return reserved;
        };*/

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user && user.emailVerified) {
                try {
                    const biblioUser = await authService.getCurrentUser();
                    setCurrentUser(biblioUser);
                } catch (error) {
                    console.error('Erreur récupération utilisateur:', error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await authService.signOut();
            setCurrentUser(null);
            setFirebaseUser(null);
            setShowUserMenu(false);
            navigate('/');
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    const UserMenu = () => (
        <div className="relative">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <div className="relative">
                    <img
                        src={currentUser?.profilePicture || currentUser?.imageUri || getRandomDefaultAvatar(currentUser?.id)}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover border-2"
                        style={{ borderColor: primaryColor }}
                    />
                    {unreadNotifications > 0 && (
                        <span
                            className="absolute -top-1 -right-1 w-5 h-5 text-xs text-white rounded-full flex items-center justify-center"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                    )}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser?.statut}</p>
                </div>
            </button>

            {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <img
                                src={currentUser?.profilePicture || currentUser?.imageUri || getRandomDefaultAvatar(currentUser?.id)}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-medium text-gray-900">{currentUser?.name}</p>
                                <p className="text-sm text-gray-500">{currentUser?.email}</p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {currentUser?.statut} • {currentUser?.departement}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* <div className="px-4 py-3 border-b border-gray-100">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-lg font-bold text-blue-600">
                                    {currentUser?.historique?.length || 0}
                                </p>
                                <p className="text-xs text-gray-500">Consultés</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600">
                                    {reservationCount}
                                </p>
                                <p className="text-xs text-gray-500">Réservations</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-orange-600">
                                    {currentUser?.docRecent?.length || 0}
                                </p>
                                <p className="text-xs text-gray-500">Récents</p>
                            </div>
                        </div>
                    </div> */}
                    <div className="py-2">
                        <NavLink
                            to="/dashboard/profile"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <User className="w-4 h-4 mr-3" />
                            Mon Profil
                        </NavLink>

                        <NavLink
                            to="/dashboard/messages"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <MessageCircle className="w-4 h-4 mr-3" />
                            Messages
                            {unreadMessages > 0 && (
                                <span className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                                    {unreadMessages}
                                </span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/dashboard/consultations"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <History className="w-4 h-4 mr-3" />
                            Historique & Réservations
                            {reservationCount > 0 && (
                                <span
                                    className="ml-auto px-2 py-1 text-xs text-white rounded-full"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {reservationCount}
                                </span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/dashboard/favorites"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <Heart className="w-4 h-4 mr-3" />
                            Favoris
                        </NavLink>
                        {/* <NavLink
                            to="/dashboard/notifications"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <Bell className="w-4 h-4 mr-3" />
                            Notifications
                            {unreadNotifications > 0 && (
                                <span className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                                    {unreadNotifications}
                                </span>
                            )}
                        </NavLink> */}
                        <div className="border-t border-gray-100 my-2"></div>
                        {/* <NavLink
                            to="/dashboard/settings"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <Settings className="w-4 h-4 mr-3" />
                            Paramètres
                        </NavLink> */}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Se déconnecter
                        </button>
                    </div>
                </div>
            )
            }
        </div >
    );

    const AuthButtons = () => (
        <div className="flex items-center space-x-3">
            <NavLink
                to="/auth"
                className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
            >
                Connexion
            </NavLink>
        </div>
    );

    if (isLoading) {
        return (
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="animate-pulse flex items-center justify-between">
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header
            className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
                ? 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200'
                : 'bg-white border-b border-gray-200'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <NavLink to="/" className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1
                                className="text-xl font-bold"
                                style={{ color: primaryColor }}
                            >
                                {organizationName}
                            </h1>
                        </div>
                    </NavLink>
                    <nav className="hidden lg:flex items-center space-x-8">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `transition-colors ${isActive
                                    ? 'font-semibold'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                            }
                            style={({ isActive }) => isActive ? { color: primaryColor } : {}}
                        >
                            Accueil
                        </NavLink>
                        <NavLink
                            to="/books"
                            className={({ isActive }) =>
                                `transition-colors ${isActive
                                    ? 'font-semibold'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                            }
                            style={({ isActive }) => isActive ? { color: primaryColor } : {}}
                        >
                            Livres
                        </NavLink>
                        <NavLink
                            to="/thesis"
                            className={({ isActive }) =>
                                `transition-colors ${isActive
                                    ? 'font-semibold'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                            }
                            style={({ isActive }) => isActive ? { color: primaryColor } : {}}
                        >
                            Mémoires
                        </NavLink>
                        <NavLink
                            to="/helps"
                            className={({ isActive }) =>
                                `transition-colors ${isActive
                                    ? 'font-semibold'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                            }
                            style={({ isActive }) => isActive ? { color: primaryColor } : {}}
                        >
                            Aides
                        </NavLink>
                    </nav>
                    <div className="flex items-center space-x-4">
                        {currentUser && firebaseUser?.emailVerified && (
                            <>
                                <NotificationIcon currentUser={currentUser} />
                                <CartDropdown currentUser={currentUser} setCurrentUser={setCurrentUser} />
                                <UserMenu />
                            </>
                        )}
                        {!currentUser && <AuthButtons />}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-white">
                        <nav className="py-4 space-y-2">
                            <NavLink
                                to="/"
                                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Accueil
                            </NavLink>
                            <NavLink
                                to="/books"
                                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Livres
                            </NavLink>
                            <NavLink
                                to="/thesis"
                                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Mémoires
                            </NavLink>
                            <NavLink
                                to="/help"
                                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Aides
                            </NavLink>
                            {currentUser && firebaseUser?.emailVerified ? (
                                <div className="px-4 py-2 border-t border-gray-100 mt-2">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <img
                                            src={currentUser.profilePicture || currentUser.imageUri || getRandomDefaultAvatar(currentUser.id)}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{currentUser.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{currentUser.statut}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <NavLink
                                            to="/dashboard/profile"
                                            className="flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4 mr-3" />
                                            Mon Profil
                                        </NavLink>

                                        <NavLink
                                            to="/dashboard/messages"
                                            className="flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-3" />
                                            Messages
                                            {unreadMessages > 0 && (
                                                <span className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                                                    {unreadMessages}
                                                </span>
                                            )}
                                        </NavLink>

                                        <NavLink
                                            to="/dashboard/consultations"
                                            className="flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <History className="w-4 h-4 mr-3" />
                                            Historique & Réservations
                                            {reservationCount > 0 && (
                                                <span
                                                    className="ml-auto px-2 py-1 text-xs text-white rounded-full"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    {reservationCount}
                                                </span>
                                            )}
                                        </NavLink>

                                        <NavLink
                                            to="/dashboard/favorites"
                                            className="flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Heart className="w-4 h-4 mr-3" />
                                            Favoris
                                        </NavLink>

                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Se déconnecter
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-2 border-t border-gray-100 mt-2 space-y-2">
                                    <NavLink
                                        to="/auth"
                                        className="block w-full px-4 py-2 text-center text-white rounded-lg transition-colors hover:opacity-90"
                                        style={{ backgroundColor: primaryColor }}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Connexion
                                    </NavLink>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                ></div>
            )}
            {showCartDropdown && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowCartDropdown(false)}
                ></div>
            )}
        </header>
    );
};

export default Header;
