/**
 * Retourne un avatar par défaut de manière consistante pour un utilisateur donné.
 * Utilise un hash de l'ID utilisateur pour choisir entre les avatars disponibles.
 */
export const getRandomDefaultAvatar = (userId: string | undefined): string => {
    const defaultAvatars = ['/annime-default-avatar.jpg', '/default-avatar.jpg'];

    if (!userId) {
        return defaultAvatars[0];
    }

    // Hash simple pour une sélection déterministe basée sur l'ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % defaultAvatars.length;
    return defaultAvatars[index];
};
