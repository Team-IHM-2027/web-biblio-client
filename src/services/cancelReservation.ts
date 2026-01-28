import { doc, writeBatch, increment } from "firebase/firestore";
import { db } from "../configs/firebase";
import { BiblioUser, EtatValue, ReservationEtatValue, TabEtatEntry } from "../types/auth";

interface CancelParams {
    name: string;
    collection: string;
    id: string;
}

/**
 * Annule une réservation :
 * - met l'état à "ras"
 * - vide le tabEtat correspondant
 * - met à jour l'objet reservations s'il existe
 * - incrémente le nombre d'exemplaires si c'est un livre
 */
export const cancelReservation = async (
    currentUser: BiblioUser,
    { name, id }: CancelParams
) => {
    const batch = writeBatch(db);
    // Utiliser documentId si disponible, sinon email
    const userDocId = currentUser.documentId || currentUser.email;
    if (!userDocId) {
        console.error("ID utilisateur manquant pour l'annulation");
        return;
    }
    const userRef = doc(db, "BiblioUser", userDocId);

    const updates: Partial<Record<keyof BiblioUser, unknown>> = {};
    let found = false;
    let isBook = false;

    // Parcourir les états pour trouver la réservation
    for (let i = 1; i <= 5; i++) {
        const etatKey = `etat${i}` as keyof BiblioUser;
        const tabEtatKey = `tabEtat${i}` as keyof BiblioUser;

        const tabEtat = currentUser[tabEtatKey] as TabEtatEntry;

        if (
            currentUser[etatKey] === "reserv" as EtatValue &&
            Array.isArray(tabEtat) &&
            tabEtat[0] === id &&
            tabEtat[1] === name
        ) {
            // Vérifier si c'est un livre en regardant la collection dans tabEtat
            const nomBD = tabEtat[4]; // nomBD est à l'index 4 dans TabEtatEntry
            isBook = nomBD === "BiblioBooks";

            updates[etatKey] = "ras" as EtatValue;
            updates[tabEtatKey] = null;
            found = true;
            break;
        }
    }

    // Met à jour la réservation dans le tableau de réservations si présent
    const updatedReservations = currentUser.reservations?.map((r) =>
        r.name === name ? { ...r, etat: "annuler" as ReservationEtatValue } : r
    );

    if (updatedReservations) {
        updates["reservations"] = updatedReservations;
    }

    if (!found && !updatedReservations) {
        console.warn("Aucune réservation à annuler trouvée.");
        return;
    }

    // Mettre à jour l'utilisateur
    batch.update(userRef, updates);

    // Si c'est un livre, incrémenter le nombre d'exemplaires
    if (isBook && found) {
        const bookRef = doc(db, "BiblioBooks", id);
        batch.update(bookRef, {
            exemplaire: increment(1)
        });
        console.log(`📚 Incrémentation d'exemplaire pour le livre: ${name}`);
    } else if (found) {
        console.log(`📖 Annulation de réservation de mémoire: ${name} (pas d'incrémentation d'exemplaire)`);
    }

    // Exécuter toutes les mises à jour en une seule transaction
    await batch.commit();

    console.log(`✅ Réservation annulée avec succès: ${name}`);
};

/**
 * Version alternative qui utilise le paramètre collection au lieu de déduire depuis tabEtat
 */
export const cancelReservationByCollection = async (
    currentUser: BiblioUser,
    { name, collection, id }: CancelParams
) => {
    const batch = writeBatch(db);
    // Utiliser documentId si disponible, sinon email
    const userDocId = currentUser.documentId || currentUser.email;
    if (!userDocId) {
        console.error("ID utilisateur manquant pour l'annulation");
        return;
    }
    const userRef = doc(db, "BiblioUser", userDocId);

    const updates: Partial<Record<keyof BiblioUser, unknown>> = {};
    let found = false;

    // Parcourir les états pour trouver la réservation
    for (let i = 1; i <= 5; i++) {
        const etatKey = `etat${i}` as keyof BiblioUser;
        const tabEtatKey = `tabEtat${i}` as keyof BiblioUser;

        const tabEtat = currentUser[tabEtatKey] as TabEtatEntry;

        if (
            currentUser[etatKey] === "reserv" as EtatValue &&
            Array.isArray(tabEtat) &&
            tabEtat[0] === id &&
            tabEtat[1] === name
        ) {
            updates[etatKey] = "ras" as EtatValue;
            updates[tabEtatKey] = null;
            found = true;
            break;
        }
    }

    // Met à jour la réservation dans le tableau de réservations si présent
    const updatedReservations = currentUser.reservations?.map((r) =>
        r.name === name ? { ...r, etat: "annuler" as ReservationEtatValue } : r
    );

    if (updatedReservations) {
        updates["reservations"] = updatedReservations;
    }

    if (!found && !updatedReservations) {
        console.warn("Aucune réservation à annuler trouvée.");
        return;
    }

    // Mettre à jour l'utilisateur
    batch.update(userRef, updates);

    // Si c'est un livre, incrémenter le nombre d'exemplaires
    if (collection === "BiblioBooks" && found) {
        const bookRef = doc(db, collection, id);
        batch.update(bookRef, {
            exemplaire: increment(1)
        });
    } else if (found) {
        console.log(`📖 Annulation de réservation de mémoire: ${name} (pas d'incrémentation d'exemplaire)`);
    }

    // Exécuter toutes les mises à jour en une seule transaction
    await batch.commit();

    console.log(`✅ Réservation annulée avec succès: ${name}`);
};
