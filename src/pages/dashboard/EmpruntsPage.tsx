import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { BiblioUser, TabEtatEntry } from "../../types/auth";
import { useConfig } from "../../contexts/ConfigContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react";

// Type local pour l'affichage
type Reservation = {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
};

const ReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orgSettings } = useConfig();
  const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const maxLoans = orgSettings?.MaximumSimultaneousLoans || 5;

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);

          const mapped: Reservation[] = [];

          // Parcourir les états 1 à N
          for (let i = 1; i <= maxLoans; i++) {
            const etatKey = `etat${i}` as keyof BiblioUser;
            const tabEtatKey = `tabEtat${i}` as keyof BiblioUser;

            const etat = user[etatKey];
            const tabEtat = user[tabEtatKey] as TabEtatEntry;

            if ((etat === 'reserv' || etat === 'emprunt') && Array.isArray(tabEtat)) {
              const [idDoc, nameDoc, categorie, image] = tabEtat;

              mapped.push({
                id: i,
                title: nameDoc ?? "Titre inconnu",
                author: "Auteur inconnu",
                coverImage: image || `https://placehold.co/200x300/1b263b/ffffff?text=Livre`,
                status: etat === 'reserv' ? "En attente de validation" : "Prêt validé",
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                location: categorie ?? "Bibliothèque",
              });
            }
          }
          setReservations(mapped);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [maxLoans]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de vos réservations..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* header simple — remplace par ton NavbarDashboard si tu veux */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4">
          <h1 className="text-xl font-bold">Mes réservations</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-6">
        {reservations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Aucune réservation pour le moment.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="bg-white p-4 shadow-md rounded-xl flex items-center space-x-6 border border-gray-100 hover:border-blue-100 transition-all hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={reservation.coverImage}
                    alt={reservation.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).onerror = null;
                      (e.currentTarget as HTMLImageElement).src = `https://placehold.co/200x300/1b263b/ffffff?text=Livre`;
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    {reservation.status === "Prêt validé" ?
                      <CheckCircle className="text-green-500 w-5 h-5" /> :
                      <Clock className="text-orange-500 w-5 h-5" />
                    }
                  </div>
                </div>

                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-gray-900">{reservation.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">{reservation.author}</p>

                  <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${reservation.status === "Prêt validé"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                      }`}>
                      {reservation.status === "Prêt validé" ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {reservation.status}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1.5">
                      <Calendar size={12} />
                      Demande effectuée
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 italic">
                    Emplacement : {reservation.location}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* footer simple — remplace par ton Footer si tu veux */}
      <footer className="bg-white mt-8 py-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Bibliothèque
        </div>
      </footer>
    </div>
  );
};

export default ReservationsPage;
