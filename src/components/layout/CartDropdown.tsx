import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle } from 'lucide-react';

import { BiblioUser, TabEtatEntry } from '../../types/auth';
import { authService } from '../../services/auth/authService';
import { useConfig } from '../../contexts/ConfigContext';
import {cancelReservation} from "../../services/cancelReservation.ts";

interface CartDropdownProps {
    currentUser: BiblioUser | null;
    setCurrentUser: (user: BiblioUser | null) => void;
}

const CartDropdown: React.FC<CartDropdownProps> = ({ currentUser, setCurrentUser }) => {
    const navigate = useNavigate();
    const { orgSettings } = useConfig();
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [tabEtatEntries, setTabEtatEntries] = useState<TabEtatEntry[]>([]);
    const maxLoans = orgSettings?.MaximumSimultaneousLoans || 5;
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    useEffect(() => {
        if (!currentUser) return;

        const entries: TabEtatEntry[] = [];
        for (let i = 1; i <= maxLoans; i++) {
            const etatKey = `etat${i}` as keyof typeof currentUser;
            const tabEtatKey = `tabEtat${i}` as keyof typeof currentUser;

            if (currentUser[etatKey] === 'reserv' && Array.isArray(currentUser[tabEtatKey])) {
                entries.push(currentUser[tabEtatKey] as TabEtatEntry);
            }
        }
        setTabEtatEntries(entries);
    }, [currentUser, maxLoans]);

    const handleCancel = async (entry: TabEtatEntry) => {
        const [idDoc, nameDoc] = entry;

        if (!currentUser) return;

        try {
            await cancelReservation(currentUser, {
                name: nameDoc,
                id: idDoc,
                collection: 'BiblioBooks',
            });

            const updatedUser = await authService.getCurrentUser();
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error('Erreur lors de l’annulation de la réservation :', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowCartDropdown(!showCartDropdown)}
                className="relative p-2 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
            >
                <ShoppingCart className="h-6 w-6" />
                {tabEtatEntries.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {tabEtatEntries.length}
          </span>
                )}
            </button>

            {showCartDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Mes Réservations</h3>
                        <span className="text-sm text-gray-500">{tabEtatEntries.length} livre(s)</span>
                    </div>

                    {tabEtatEntries.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                            <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Aucune réservation active</p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {tabEtatEntries.map((entry, index) => {
                                const [idDoc, nameDoc, cathegorie, image] = entry;

                                return (
                                    <div key={index} className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-start">
                                            <img
                                                src={image}
                                                alt={nameDoc}
                                                className="w-12 h-16 object-cover rounded"
                                            />
                                            <div className="ml-3 flex-1">
                                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{nameDoc}</h4>
                                                <p className="text-xs text-gray-500">{cathegorie}</p>
                                                <div className="mt-2 flex items-center">
                                                    <button
                                                        onClick={() => navigate(`/books/${idDoc}`)}
                                                        className="text-xs cursor-pointer hover:text-blue-800 mr-3"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        Voir détails
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(entry)}
                                                        className="text-xs cursor-pointer text-red-600 hover:text-red-800"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tabEtatEntries.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200">
                            <button
                               onClick={() => {
    navigate("/dashboard/emprunts", {
        state: { reservations: tabEtatEntries }
    });
    setShowCartDropdown(false);
}}

                                className="block w-full text-center cursor-pointer text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Voir toutes les réservations
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CartDropdown;
