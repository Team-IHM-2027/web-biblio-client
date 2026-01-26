/**
 * Retourne un avatar par défaut de manière consistante pour un utilisateur donné.
 * Utilise un hash de l'ID utilisateur pour choisir entre les avatars disponibles.
 */
export const getRandomDefaultAvatar = (): string => {
    return '/annime-default-avatar.jpg';
};
