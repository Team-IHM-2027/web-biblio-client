// src/components/chat/UserSelectorModal.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { X, Search, User, MessageCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import type { BiblioUser } from '../../types/auth';

interface UserSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (user: BiblioUser) => void;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({ isOpen, onClose, onSelectUser }) => {
    const [users, setUsers] = useState<BiblioUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'BiblioUser');
            const q = query(usersRef, orderBy('name'), limit(50));
            const snapshot = await getDocs(q);
            const userList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BiblioUser[];
            setUsers(userList);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Démarrer une conversation</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur (nom ou email)..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-500">Chargement des utilisateurs...</p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                                className="w-full flex items-center p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-blue-600 group-hover:bg-blue-200 transition-colors">
                                    {user.profilePicture ? (
                                        <img src={user.profilePicture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-800 truncate">{user.name}</h4>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <MessageCircle size={20} className="text-gray-300 group-hover:text-blue-500 ml-2" />
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Search size={48} className="mb-4 text-gray-200" />
                            <p>Aucun utilisateur trouvé</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
