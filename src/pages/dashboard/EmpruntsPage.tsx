import React, { useState } from "react";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  // Données envoyées depuis le dropdown (navigate(path, { state: { reservations } }))
  const incomingReservations: any[] = location.state?.reservations || [];

  // Transformation minimale pour correspondre à l'UI
  const mappedReservations: Reservation[] = incomingReservations.map((entry: any, index: number) => {
    const [idDoc, nameDoc, categorie, image] = entry ?? [];

    return {
      id: typeof idDoc === "number" ? idDoc : index,
      title: nameDoc ?? "Titre inconnu",
      author: "Auteur inconnu",
      coverImage: image || `https://placehold.co/200x300/1b263b/ffffff?text=Livre`,
      status: "En attente",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      location: categorie ?? "Bibliothèque",
    };
  });

  const [reservations] = useState<Reservation[]>(mappedReservations);

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
                className="bg-white p-4 shadow-md rounded-lg flex items-center space-x-4"
              >
                <img
                  src={reservation.coverImage}
                  alt={reservation.title}
                  className="w-20 h-28 object-cover rounded"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).onerror = null;
                    (e.currentTarget as HTMLImageElement).src = `https://placehold.co/200x300/1b263b/ffffff?text=Livre`;
                  }}
                />

                <div className="flex-grow">
                  <h2 className="text-lg font-semibold">{reservation.title}</h2>
                  <p className="text-gray-600">{reservation.author}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Statut : <span className="font-medium">{reservation.status}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
