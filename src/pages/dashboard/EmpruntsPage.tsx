import { useState } from 'react';
import { Search, Filter, Calendar, Clock, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Définition des variables de couleur
const COLORS = {
  primary: '#ff8c00',    // Orange
  secondary: '#1b263b',  // Dark Blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  danger: '#ef4444',     // Red
  pending: '#3b82f6',    // Blue
};

// Types pour les réservations
type ReservationStatus = 'en_cours' | 'terminée' | 'annulée' | 'en_attente';

interface Reservation {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  status: ReservationStatus;
  startDate: string;
  endDate: string;
  location: string;
}

// Données des réservations
const reservationsData: Reservation[] = [
  {
    id: 1,
    title: 'Les Misérables',
    author: 'Victor Hugo',
    coverImage: '/api/placeholder/200/300',
    status: 'en_cours',
    startDate: '2025-04-01',
    endDate: '2025-04-15',
    location: 'Bibliothèque centrale - Étage 2'
  },
  {
    id: 2,
    title: 'Le Comte de Monte-Cristo',
    author: 'Alexandre Dumas',
    coverImage: '/api/placeholder/200/300',
    status: 'en_attente',
    startDate: '2025-04-10',
    endDate: '2025-04-24',
    location: 'Bibliothèque annexe - Section Romans'
  },
  {
    id: 3,
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    coverImage: '/api/placeholder/200/300',
    status: 'terminée',
    startDate: '2025-03-15',
    endDate: '2025-03-29',
    location: 'Bibliothèque centrale - Section Jeunesse'
  },
  {
    id: 4,
    title: 'L\'Étranger',
    author: 'Albert Camus',
    coverImage: '/api/placeholder/200/300',
    status: 'annulée',
    startDate: '2025-03-20',
    endDate: '2025-04-03',
    location: 'Bibliothèque centrale - Étage 1'
  },
  {
    id: 5,
    title: 'Germinal',
    author: 'Émile Zola',
    coverImage: '/api/placeholder/200/300',
    status: 'en_cours',
    startDate: '2025-04-05',
    endDate: '2025-04-19',
    location: 'Bibliothèque annexe - Section Classiques'
  },
];

// Composant de carte de réservation
const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'en_cours': return COLORS.primary;
      case 'terminée': return COLORS.success;
      case 'annulée': return COLORS.danger;
      case 'en_attente': return COLORS.pending;
      default: return COLORS.warning;
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: ReservationStatus) => {
    switch (status) {
      case 'en_cours': return 'En cours';
      case 'terminée': return 'Terminée';
      case 'annulée': return 'Annulée';
      case 'en_attente': return 'En attente';
      default: return status;
    }
  };

  // Calcul du temps restant
  const calculateTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Dépassé';
    if (days === 0) return 'Dernier jour';
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex flex-col md:flex-row">
        {/* Couverture du livre */}
        <div className="md:w-1/4 p-4 flex items-center justify-center bg-gray-50">
          <div className="w-32 h-48 rounded-md overflow-hidden shadow-md">
            <img
              src={reservation.coverImage}
              alt={reservation.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Informations de la réservation */}
        <div className="md:w-3/4 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{reservation.title}</h3>
              <p className="text-gray-600">{reservation.author}</p>
            </div>
            <div
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${getStatusColor(reservation.status)}15`,
                color: getStatusColor(reservation.status)
              }}
            >
              {getStatusLabel(reservation.status)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Calendar size={18} className="mr-2 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Période de réservation</p>
                <p className="text-sm">
                  {new Date(reservation.startDate).toLocaleDateString('fr-FR')} - {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <p className="text-sm font-medium" style={{ color: getStatusColor(reservation.status) }}>
                  {reservation.status === 'en_cours' && calculateTimeLeft(reservation.endDate)}
                  {reservation.status === 'en_attente' && 'En attente de confirmation'}
                  {reservation.status === 'terminée' && 'Livre retourné'}
                  {reservation.status === 'annulée' && 'Réservation annulée'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Emplacement</p>
            <p className="text-sm">{reservation.location}</p>
          </div>

          <div className="mt-6 flex space-x-3">
            {reservation.status === 'en_cours' && (
              <button
                className="px-4 py-2 rounded-lg flex items-center transition-colors"
                style={{
                  backgroundColor: `${COLORS.success}15`,
                  color: COLORS.success
                }}
              >
                <Check size={16} className="mr-2" />
                Prolonger
              </button>
            )}

            {reservation.status === 'en_attente' && (
              <button
                className="px-4 py-2 rounded-lg flex items-center transition-colors"
                style={{
                  backgroundColor: `${COLORS.danger}15`,
                  color: COLORS.danger
                }}
              >
                <X size={16} className="mr-2" />
                Annuler
              </button>
            )}

            <button
              className="px-4 py-2 rounded-lg flex items-center transition-colors"
              style={{
                backgroundColor: `${COLORS.secondary}15`,
                color: COLORS.secondary
              }}
            >
              Détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal de la page des réservations
const ReservationsPage = () => {
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | 'toutes'>('toutes');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage des réservations
  const filteredReservations = reservationsData.filter(reservation => {
    const matchesFilter = activeFilter === 'toutes' || reservation.status === activeFilter;
    const matchesSearch = reservation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          reservation.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mes Emprunts</h1>
        <p className="text-gray-500">Gérez vos emprunts et réservations de livres</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un livre..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center overflow-x-auto space-x-2 py-1">
          <span className="flex items-center text-gray-500 mr-2">
            <Filter size={16} className="mr-1" /> Filtrer:
          </span>

          <button
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeFilter === 'toutes'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveFilter('toutes')}
          >
            Toutes
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeFilter === 'en_cours'
                ? `bg-${COLORS.primary} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={activeFilter === 'en_cours' ? { backgroundColor: COLORS.primary } : {}}
            onClick={() => setActiveFilter('en_cours')}
          >
            En cours
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeFilter === 'en_attente'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={activeFilter === 'en_attente' ? { backgroundColor: COLORS.pending } : {}}
            onClick={() => setActiveFilter('en_attente')}
          >
            En attente
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeFilter === 'terminée'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={activeFilter === 'terminée' ? { backgroundColor: COLORS.success } : {}}
            onClick={() => setActiveFilter('terminée')}
          >
            Terminées
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeFilter === 'annulée'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={activeFilter === 'annulée' ? { backgroundColor: COLORS.danger } : {}}
            onClick={() => setActiveFilter('annulée')}
          >
            Annulées
          </button>
        </div>
      </div>

      {/* Liste des réservations */}
      <div className="space-y-6">
        {filteredReservations.length > 0 ? (
          filteredReservations.map(reservation => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Aucune réservation trouvée</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery
                ? "Aucun résultat ne correspond à votre recherche."
                : activeFilter !== 'toutes'
                  ? `Vous n'avez pas de réservation ${getFilterLabel(activeFilter)}.`
                  : "Vous n'avez pas encore réservé de livre."
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredReservations.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100">
              <ChevronLeft size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-medium">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700">
              2
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700">
              3
            </button>
            <span className="px-2 text-gray-500">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700">
              8
            </button>
            <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Fonction utilitaire pour les libellés des filtres
const getFilterLabel = (filter: ReservationStatus | 'toutes') => {
  switch (filter) {
    case 'en_cours': return 'en cours';
    case 'terminée': return 'terminée';
    case 'annulée': return 'annulée';
    case 'en_attente': return 'en attente';
    case 'toutes': return 'toutes';
    default: return filter;
  }
};

export default ReservationsPage;
