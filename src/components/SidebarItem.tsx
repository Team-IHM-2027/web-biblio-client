import { NavLink } from 'react-router-dom';

const SidebarItem = ({ item, collapsed }: { item: any; collapsed: boolean }) => {
  return (
    <li className="mb-1 px-2">
      <NavLink
        to={item.path}
        className={({ isActive }: { isActive: boolean }) => `
          flex items-center rounded-md p-2 transition-colors
          ${isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}
        `}
      >
        <div
          className="flex items-center justify-center"
          style={{ color: 'var(--primary-color)' }}
        >
          {item.icon}
        </div>
        {!collapsed && (
          <span className="ml-3 text-gray-700">{item.name}</span>
        )}
      </NavLink>
    </li>
  );
};

export default SidebarItem;