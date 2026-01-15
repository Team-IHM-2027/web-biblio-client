export interface BookDocument {
  id: string;
  name: string;
  title?: string;
  auteur: string;
  cathegorie: string;
  desc?: string;
  edition?: string;
  etagere?: string;
  exemplaire: number;
  initialExemplaire?: number;
  image: string;
  salle?: string;
  type?: string;
  nomBD?: string;
  commentaire?: Array<{
    heure: any;
    nomUser: string;
    note: number | string;
    texte: string;
    userId?: string;
  }>;
}

// Interface compatible avec votre composant BookCard
export interface BiblioBook extends BookDocument {
  imageUrl?: string;
  category?: string;
  author?: string;
  description?: string;
}