import { Timestamp } from 'firebase/firestore';

export type UserStatus = 'etudiant' | 'enseignant';
export type UserLevel = 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export type EtatValue = 'ras' | 'emprunt' | 'reserv' | 'retard';
export type ReservationEtatValue = 'annuler' | 'reserver' | 'emprunt' | 'refuser';
export type MessageRecipientType = 'E' | 'R';
export type NotificationType = 'reservation_confirmed' | 'reservation';

// Interface pour les départements (conservée)
export interface Department {
    id: string;
    name: string;
    code: string;
}

// Interface pour les niveaux académiques (conservée)
export interface AcademicLevel {
    id: string;
    name: string;
    code: string;
}

// Interface pour les éléments dans docRecent
export interface DocRecentItem {
    cathegorieDoc: string;
    dateReservation?: Timestamp;
    desc?: string;
    image?: string;
    nameDoc?: string;
    type: string;
}

// Interface pour les éléments dans historique
export interface HistoriqueItem {
    cathegorieDoc: string;
    dateVue: Timestamp;
    desc: string;
    image: string;
    nameDoc: string;
    type: string;
}

// Interface pour les éléments dans messages
export interface MessageItem {
    heure: Timestamp;
    lu: boolean;
    lue?: boolean;
    recue: MessageRecipientType;
    texte: string;
    id?: string;
    type?: 'admin' | 'bot';
}

// Interface pour les éléments dans notifications
export interface NotificationItem {
    date: Timestamp;
    id: string;
    message: string;
    read: boolean;
    title: string;
    type: NotificationType;
}

// Interface pour les éléments dans reservations
export interface ReservationItem {
    cathegorie: string;
    dateReservation: Timestamp;
    etat: ReservationEtatValue;
    exemplaire: number;
    image: string;
    name: string;
    nomBD: string;
    dateEmprunt?: string; // Ajouté pour correspondre à la logique Admin
    validatedBy?: string; // Ajouté pour correspondre à la logique Admin
}

// Type pour la structure des tableaux tabEtat
// [idDoc, nameDoc, cathegorieDoc, image, nomBD, date, exemplaire]
export type TabEtatEntry = [
    string,     // idDoc
    string,     // nameDoc
    string,     // cathegorieDoc
    string,     // image
    string,     // nomBD
    Timestamp,  // date
    number      // exemplaire
];

// Interface principale UserData - remplace BiblioUser
export interface UserData {
    createdAt: Timestamp;
    departement: string;
    docRecent: DocRecentItem[];
    email: string;
    emailVerified: boolean;
    etat1: EtatValue;
    etat2: EtatValue;
    etat3: EtatValue;
    historique: HistoriqueItem[];
    imageUri: string;
    inscritArchi: string;
    lastLoginAt: Timestamp;
    level: UserLevel;
    messages: MessageItem[];
    name: string;
    niveau: string;
    notifications: NotificationItem[];
    profilePicture?: string;
    reservations: ReservationItem[];
    searchHistory: string[];
    tabEtat1?: TabEtatEntry;
    tabEtat2?: TabEtatEntry;
    tabEtat3?: TabEtatEntry;
    tabEtat4?: TabEtatEntry;
    tabEtat5?: TabEtatEntry;
    tel: string;
    username: string;
    statut: UserStatus;
}

// Interface BiblioUser mise à jour pour correspondre à UserData
export interface BiblioUser {
    id: string;
    name: string;
    matricule?: string;
    email: string;
    niveau: string;
    departement: string;
    tel: string;
    createdAt: Timestamp;
    lastLoginAt: Timestamp;
    level: UserLevel;
    tabEtat1?: TabEtatEntry | null;
    tabEtat2?: TabEtatEntry | null;
    tabEtat3?: TabEtatEntry | null;
    tabEtat4?: TabEtatEntry | null;
    tabEtat5?: TabEtatEntry | null;
    etat?: 'bloc' | 'ras';
    blockedReason?: string;
    blockedAt?: string;
    etat1?: EtatValue;
    etat2?: EtatValue;
    etat3?: EtatValue;
    etat4?: EtatValue;
    etat5?: EtatValue;
    emailVerified: boolean;
    profilePicture?: string;
    statut: UserStatus;
    // Nouvelles propriétés ajoutées
    docRecent: DocRecentItem[];
    historique: HistoriqueItem[];
    imageUri: string;
    inscritArchi: string;
    messages: MessageItem[];
    notifications: NotificationItem[];
    reservations?: ReservationItem[];
    searchHistory: string[];
    username?: string;
    documentId?: string; // ID du document Firestore (peut être email ou UID)
}

// Interfaces pour les formulaires (conservées et mises à jour)
export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    matricule?: string; // Rendu optionnel
    tel: string;
    statut: UserStatus;
    departement?: string;
    niveau?: string;
    profilePicture?: string | File;
    username?: string; // Nouveau champ
}

export interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

// Interface pour le contexte d'authentification (mise à jour)
export interface AuthContextType {
    user: BiblioUser | null;
    loading: boolean;
    signIn: (data: LoginFormData) => Promise<void>;
    signUp: (data: RegisterFormData) => Promise<void>;
    signOut: () => Promise<void>;
    sendEmailVerification: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<BiblioUser>) => Promise<void>;
}

// Interfaces utilitaires (conservées)
export interface FormErrors {
    [key: string]: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: BiblioUser;
}

export interface EmailVerificationProps {
    email: string;
    onResendEmail: () => Promise<void>;
    onBackToLogin: () => void;
}

export interface PasswordResetProps {
    email: string;
    onBackToLogin: () => void;
}

// Constantes pour les niveaux académiques (conservées)
export const ACADEMIC_LEVELS: AcademicLevel[] = [
    { id: 'licence1', name: 'Licence 1', code: 'L1' },
    { id: 'licence2', name: 'Licence 2', code: 'L2' },
    { id: 'licence3', name: 'Licence 3', code: 'L3' },
    { id: 'master1', name: 'Master 1', code: 'M1' },
    { id: 'master2', name: 'Master 2', code: 'M2' },
    { id: 'doctorat', name: 'Doctorat', code: 'DOC' }
];

// Constantes pour les départements (conservées)
export const DEPARTMENTS: Department[] = [
    { id: 'informatique', name: 'Informatique', code: 'INFO' },
    { id: 'mathematiques', name: 'Mathématiques', code: 'MATH' },
    { id: 'physique', name: 'Physique', code: 'PHYS' },
    { id: 'chimie', name: 'Chimie', code: 'CHIM' },
    { id: 'biologie', name: 'Biologie', code: 'BIO' },
    { id: 'genie_civil', name: 'Génie Civil', code: 'GC' },
    { id: 'genie_electrique', name: 'Génie Électrique', code: 'GE' },
    { id: 'genie_mecanique', name: 'Génie Mécanique', code: 'GM' }
];

// Constantes pour les types d'état (nouvelles)
export const ETAT_VALUES: EtatValue[] = ['ras', 'emprunt', 'retard'];

export const RESERVATION_ETAT_VALUES: ReservationEtatValue[] = ['annuler', 'reserver'];

export const MESSAGE_RECIPIENT_TYPES: MessageRecipientType[] = ['E', 'R'];

export const NOTIFICATION_TYPES: NotificationType[] = ['reservation_confirmed', 'reservation'];

// Fonctions utilitaires pour les nouveaux types
export const isValidEtatValue = (value: string): value is EtatValue => {
    return ETAT_VALUES.includes(value as EtatValue);
};

export const isValidReservationEtatValue = (value: string): value is ReservationEtatValue => {
    return RESERVATION_ETAT_VALUES.includes(value as ReservationEtatValue);
};

export const isValidMessageRecipientType = (value: string): value is MessageRecipientType => {
    return MESSAGE_RECIPIENT_TYPES.includes(value as MessageRecipientType);
};

export const isValidNotificationType = (value: string): value is NotificationType => {
    return NOTIFICATION_TYPES.includes(value as NotificationType);
};

// Helper functions pour TabEtatEntry
export const createTabEtatEntry = (
    idDoc: string,
    nameDoc: string,
    cathegorieDoc: string,
    image: string,
    nomBD: string,
    date: Timestamp,
    exemplaire: number
): TabEtatEntry => {
    return [idDoc, nameDoc, cathegorieDoc, image, nomBD, date, exemplaire];
};

export const parseTabEtatEntry = (entry: TabEtatEntry) => {
    const [idDoc, nameDoc, cathegorieDoc, image, nomBD, date, exemplaire] = entry;
    return {
        idDoc,
        nameDoc,
        cathegorieDoc,
        image,
        nomBD,
        date,
        exemplaire
    };
};
