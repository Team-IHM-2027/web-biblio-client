// src/layouts/DashboardLayout.tsx
import { useState, useEffect, JSX } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  User,
  Calendar,
  MessageCircle,
  Clock,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  Menu,

} from 'lucide-react';
import { authService } from '../services/auth/authService';
import { BiblioUser } from '../types/auth';
import { useConfig } from '../contexts/ConfigContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Interface pour les menus
interface MenuItem {
  path: string;
  name: string;
  icon: JSX.Element;
  badge?: number;
}

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<BiblioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { orgSettings } = useConfig();

  // Configuration des couleurs dynamiques
  const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
  const secondaryColor = '#1b263b';
  const lightText = '#ffffff';

  // Helper function to darken color
  const darkenColor = (color: string, percent: number = 20) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const primaryColorDark = darkenColor(primaryColor);

  // Récupération des données utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Détection du mode mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      name: 'Profil',
      icon: <User size={20} />
    },
    {
      path: '/dashboard/emprunts',
      name: 'Emprunts',
      icon: <Calendar size={20} />,
      badge: 2
    },
    {
      path: '/dashboard/chat',
      name: 'Chat',
      icon: <MessageCircle size={20} />
    },

    {
      path: '/dashboard/consultations',
      name: 'Consultations',
      icon: <Clock size={20} />
    },
    {
      path: '/dashboard/notifications',
      name: 'Notifications',
      icon: <Bell size={20} />,
      badge: 5
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <aside
        className={`fixed md:relative h-full transition-all duration-300 z-20 ${
          isMobile && !collapsed ? 'translate-x-0' : isMobile && collapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          width: collapsed ? '80px' : '280px',
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${darkenColor(secondaryColor, 10)} 100%)`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Overlay décoratif */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${primaryColor} 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, ${primaryColor} 0%, transparent 50%)`
          }}
        />

        {/* Logo et bouton de toggle */}
        <div className="relative h-20 flex items-center px-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-xl shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <BookOpen size={24} color="white" />
              </div>
              <div>
                <Link to="/" className="text-xl font-bold text-white">BiblioENSPY</Link>
                <p className="text-xs text-gray-300">Bibliothèque Numérique</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div
              className="p-2 rounded-xl shadow-lg mx-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <BookOpen size={24} color="white" />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`absolute ${collapsed ? 'right-0 top-1/2 -translate-y-1/2 -mr-4' : 'right-4 top-1/2 -translate-y-1/2'}
                      p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white
                      focus:outline-none shadow-lg transition-all duration-300 hover:scale-110`}
            style={{ color: primaryColor }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="relative px-4 py-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg">
                <img
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name?.replace(' ', '+') || 'User'}&background=${primaryColor.replace('#', '')}&color=ffffff&size=200&font-size=0.4`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
                style={{ display: collapsed ? 'none' : 'block' }}
              />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate text-sm">
                  {user?.name || 'Utilisateur'}
                </h3>
                <p className="text-gray-300 text-xs truncate">
                  {user?.email || 'email@example.com'}
                </p>
                <div className="flex items-center mt-1">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor
                    }}
                  >
                    {user?.statut === 'etudiant' ? 'Étudiant' : 'Enseignant'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="mt-4 px-3 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path ||
                              (item.path === '/dashboard' && location.pathname === '/dashboard');

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'font-semibold shadow-lg transform scale-105'
                        : 'hover:bg-white/10 hover:transform hover:scale-105'
                    }`}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${primaryColor}, ${primaryColorDark})`
                        : 'transparent',
                      color: isActive ? 'white' : lightText,
                    }}
                  >
                    {/* Effet de brillance au hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                                    transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                                    transition-transform duration-700 ease-out" />

                    <div className="flex items-center justify-center relative z-10">
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <div className="relative ml-3 flex-1 z-10">
                        <span className="whitespace-nowrap">{item.name}</span>
                        {item.badge && (
                          <span
                            className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full
                                     flex items-center justify-center text-white"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {collapsed && item.badge && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 text-xs font-bold rounded-full
                                 flex items-center justify-center text-white"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-white/10 p-4">
          <NavLink
            to="/auth"
            className="group flex items-center px-3 py-3 rounded-xl transition-all duration-300
                     hover:bg-red-500/20 hover:transform hover:scale-105 relative overflow-hidden"
            style={{ color: lightText }}
          >
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                            transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                            transition-transform duration-700 ease-out" />

            <div className="flex items-center justify-center relative z-10">
              <LogOut size={20} />
            </div>

            {!collapsed && (
              <span className="ml-3 whitespace-nowrap relative z-10">Se déconnecter</span>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Toggle button for mobile */}
      {isMobile && collapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 p-3 rounded-full bg-white shadow-xl
                   hover:shadow-2xl transition-all duration-300 hover:scale-110"
          style={{ color: primaryColor }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Main content */}
      <main
        className="flex-1 overflow-auto transition-all duration-300 relative"
        style={{
          background: `linear-gradient(to bottom right, #f8fafc, ${primaryColor}10, ${secondaryColor}05)`
        }}
      >
        {/* Header bar moderne */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {location.pathname === '/' ? 'Accueil' :
                 location.pathname.includes('profile') ? 'Profil' :
                 location.pathname.includes('reservations') ? 'Réservations' :
                 location.pathname.includes('cart') ? 'Panier' :
                 location.pathname.includes('chat') ? 'Chat' :
                 location.pathname.includes('statistics') ? 'Statistiques' :
                 location.pathname.includes('history') ? 'Historique' :
                 location.pathname.includes('notifications') ? 'Notifications' :
                 'Dashboard'}
              </h1>
              <p className="text-gray-600 text-sm">
                Bienvenue, {user?.name?.split(' ')[0] || 'Utilisateur'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                style={{ color: primaryColor }}
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                style={{ color: primaryColor }}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
