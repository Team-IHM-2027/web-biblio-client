import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth/authService";
import { BiblioUser, TabEtatEntry } from "../../types/auth";
import { useConfig } from "../../contexts/ConfigContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Clock, Calendar, CheckCircle } from "lucide-react";

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

const EmpruntsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orgSettings } = useConfig();
  const [currentUser, setCurrentUser] = useState<BiblioUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Reservation[]>([]);

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

            // Filter for 'emprunt' status only
            if (etat === 'emprunt' && Array.isArray(tabEtat)) {
              const [idDoc, nameDoc, categorie, image] = tabEtat;

              mapped.push({
                id: i,
                title: nameDoc ?? "Titre inconnu",
                author: "Auteur inconnu",
                coverImage: image || `https://placehold.co/200x300/1b263b/ffffff?text=Livre`,
                status: "Prêt validé",
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                location: categorie ?? "Bibliothèque",
              });
            }
          }
          setLoans(mapped);
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
    return <LoadingSpinner size="lg" text="Chargement de vos emprunts..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* header simple — remplace par ton NavbarDashboard si tu veux */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4">
          <h1 className="text-xl font-bold">Mes emprunts actuels</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-6">
        {loans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Aucun emprunt en cours.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {loans.map((loan) => (
              <li
                key={loan.id}
                className="bg-white p-4 shadow-md rounded-xl flex items-center space-x-6 border border-gray-100 hover:border-blue-100 transition-all hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={loan.coverImage}
                    alt={loan.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).onerror = null;
                      (e.currentTarget as HTMLImageElement).src = `https://placehold.co/200x300/1b263b/ffffff?text=Livre`;
                    }}
                  />
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-gray-900">{loan.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">{loan.author}</p>

                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 bg-green-100 text-green-700">
                      <CheckCircle size={12} />
                      Prêt validé
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1.5">
                      <Calendar size={12} />
                      Demande effectuée
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 italic">
                    Emplacement : {loan.location}
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

export default EmpruntsPage;
