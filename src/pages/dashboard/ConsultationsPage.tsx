// src/pages/dashboard/HistoryPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { historyService, HistoryEvent } from '../../services/historyService';
import { authService } from '../../services/auth/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Book, Clock, Filter, GraduationCap, Calendar } from 'lucide-react';

const HistoryPage = () => {
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'book_view' | 'thesis_view' | 'reservation'>('all');

    useEffect(() => {
        const fetchData = async () => {
            const user = await authService.getCurrentUser();
            if (user) {
                if (user.id) {
                    const userHistory = await historyService.getUserHistory(user.id);
                    setHistory(userHistory);
                }
                if (user.reservations) {
                    setReservations(user.reservations);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const filteredReservations = (reservations || []).map(res => ({
        id: `res-${res.dateReservation?.seconds || Date.now()}`,
        userId: '',
        type: 'reservation' as const,
        itemId: res.bookId || '',
        itemTitle: res.name || 'Réservation',
        itemCoverUrl: res.image,
        timestamp: res.dateReservation,
        etat: res.etat
    })).filter(res => res.timestamp);

    const combinedHistory = [
        ...history,
        ...filteredReservations
    ].filter(item => {
        if (filter === 'all') return true;
        return item.type === filter;
    });

    const groupHistoryByDate = (historyEvents: any[]) => {
        const grouped: { [key: string]: any[] } = {};
        const sortedEvents = [...historyEvents].sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
        });

        sortedEvents.forEach(event => {
            const date = event.timestamp?.toDate ? event.timestamp.toDate().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : new Date().toLocaleDateString('fr-FR');

            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    };

    const groupedAndFilteredHistory = groupHistoryByDate(combinedHistory);

    if (loading) {
        return <LoadingSpinner size="lg" text="Chargement de votre historique..." />;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* En-tête de la page */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Historique & Réservations</h1>
                    <p className="text-gray-500 mt-1">Vos dernières activités et réservations.</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 flex-wrap">
                <Filter size={20} className="text-gray-500" />
                <FilterButton label="Tout" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                {/* <FilterButton label="Livres" isActive={filter === 'book_view'} onClick={() => setFilter('book_view')} />
                <FilterButton label="Mémoires" isActive={filter === 'thesis_view'} onClick={() => setFilter('thesis_view')} /> */}
                <FilterButton label="Réservations" isActive={filter === 'reservation'} onClick={() => setFilter('reservation')} />
            </div>

            {/* Timeline de l'historique */}
            <div className="space-y-8">
                {Object.keys(groupedAndFilteredHistory).length > 0 ? (
                    Object.entries(groupedAndFilteredHistory).map(([date, eventList]) => (
                        <div key={date}>
                            <h2 className="font-semibold text-lg text-secondary mb-4 pb-2 border-b-2 border-primary/20">{date}</h2>
                            <div className="space-y-4">
                                {eventList.map((event: any) => (
                                    <HistoryItem key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-secondary">Aucune activité à afficher</h3>
                        <p className="text-gray-500 mt-2">Commencez l'exploration ou effectuez votre première réservation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Composant pour un bouton de filtre
const FilterButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
    >
        {label}
    </button>
);

// Composant pour un élément de l'historique
const HistoryItem = ({ event }: { event: any }) => {
    const isBook = event.type === 'book_view';
    const isThesis = event.type === 'thesis_view';
    const isReservation = event.type === 'reservation';

    let linkTo = '#';
    if (isBook) linkTo = `/books/${event.itemId}`;
    else if (isThesis) linkTo = `/thesis/${event.itemId}`;

    const Icon = isReservation ? Calendar : (isBook ? Book : GraduationCap);

    return (
        <div className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-lg border border-transparent transition-all duration-300 group">
            <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img
                        src={event.itemCoverUrl || `https://ui-avatars.com/api/?name=${event.itemTitle.charAt(0)}&background=1b263b&color=fff&size=64`}
                        alt={event.itemTitle}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Icon size={16} className={isReservation ? "text-orange-500" : (isBook ? "text-primary" : "text-blue-500")} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${isReservation ? "text-orange-500" : (isBook ? "text-primary" : "text-blue-500")
                                }`}>
                                {isReservation ? "Réservation" : (isBook ? "Livre" : "Mémoire")}
                            </span>
                        </div>
                        {/* {isReservation && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${event.etat === 'emprunt' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                {event.etat === 'emprunt' ? "Validé" : "En attente"}
                            </span>
                        )} */}
                    </div>
                    {linkTo !== '#' ? (
                        <Link to={linkTo}>
                            <h4 className="font-semibold text-secondary group-hover:text-primary transition-colors">{event.itemTitle}</h4>
                        </Link>
                    ) : (
                        <h4 className="font-semibold text-secondary">{event.itemTitle}</h4>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        {isReservation ? 'Effectuée' : 'Consulté'} à {event.timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;