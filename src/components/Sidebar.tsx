//Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  User,
  Calendar,
  ShoppingCart,
  MessageCircle,
  History,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SidebarItem from './SidebarItem';

const Sidebar = ({ collapsed, toggleSidebar }: { collapsed: boolean; toggleSidebar: () => void }) => {
  const menuItems = [
    {
      path: '/dashboard/profile',
      name: 'Profil',
      icon: <User />
    },
    {
      path: '/dashboard/emprunts',
      name: 'Mes Emprunts',
      icon: <Calendar />
    },
    {
      path: '/dashboard/cart',
      name: 'Panier',
      icon: <ShoppingCart />
    },
    {
      path: '/dashboard/messages',
      name: 'Messages',
      icon: <MessageCircle />
    },
    {
      path: '/dashboard/consultations',
      name: 'Consultations',
      icon: <History />
    },
    {
      path: '/dashboard/notifications',
      name: 'Notifications',
      icon: <Bell />
    }
  ];

  return (
    <div
      className="fixed h-full bg-white shadow-lg transition-all duration-300 z-10"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="text-xl font-bold" style={{ color: 'var(--secondary-color)' }}>
            BiblioENSPY
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
          style={{ color: 'var(--primary-color)' }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <div className="py-4">
        <nav>
          <ul>
            {menuItems.map((item, index) => (
              <SidebarItem
                key={index}
                item={item}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </nav>
      </div>

      <div className="absolute bottom-0 w-full border-t p-4">
        <NavLink
          to="/logout"
          className={`flex items-center rounded-md p-2 transition-colors hover:bg-gray-100`}
        >
          <div
            className="flex items-center justify-center"
            style={{ color: 'var(--primary-color)' }}
          >
            <LogOut size={20} />
          </div>
          {!collapsed && (
            <span className="ml-3 text-gray-700">Se déconnecter</span>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
