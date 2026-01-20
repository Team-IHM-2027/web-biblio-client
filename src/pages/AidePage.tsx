import React, { FC } from 'react';
import { MessageCircle, FileText, LifeBuoy } from 'lucide-react';

// ==============================================================================
// 🚨 MOCKS D'INTÉGRATION 🚨
// Ces définitions mockent les imports externes pour permettre la compilation
// dans un environnement isolé. Vous devez les supprimer et réactiver
// vos imports réels lors de l'intégration dans votre projet.
// ==============================================================================

// 1. Mock de useConfig
const useConfig = () => ({
    orgSettings: {
        Theme: { Primary: '#ff8c00', Secondary: '#1b263b' },
        Name: 'BiblioENSPY'
    }
});

// 2. Mock du Header
const Header: FC = () => {
    const { orgSettings } = useConfig();
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';

    return (
        <header className="bg-white shadow-md p-4 text-center text-xl font-bold border-b-4" style={{ borderColor: primaryColor }}>
            <div className="container mx-auto">
                <p className="text-gray-800">Bibliothèque Numérique</p>
            </div>
        </header>
    );
};

// 3. Mock du Footer
const Footer: FC = () => {
    const { orgSettings } = useConfig();
    //@ts-ignore
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    return (
        <footer className="bg-[#1b263b] text-white p-6 text-center text-sm">
            © {new Date().getFullYear()} {organizationName}. Tous droits réservés.
        </footer>
    );
};
// ==============================================================================


const AidePage: React.FC = () => {
    // Récupération des couleurs de la configuration globale via le mock
    const { orgSettings } = useConfig();
    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = orgSettings?.Theme?.Secondary || '#1b263b';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Le composant Header est maintenant mocké localement */}
            <Header />

            {/* En-tête/Hero Section pour la page d'aide */}
            <div className="border bg-[#1b263b] border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <LifeBuoy className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
                        <h1
                            className="text-4xl md:text-5xl font-bold mb-4 text-white"
                        >
                            Centre d'Aide et Support
                        </h1>
                        <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Nous sommes là pour vous aider. Trouvez des guides, contactez nos experts,
                            et obtenez les réponses à toutes vos questions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contenu principal / Section d'aide demandée */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border border-gray-100">
                        <div className="text-center">
                            <h3 className="text-3xl font-extrabold text-gray-800 mb-4">
                                Besoin d'aide pour votre recherche académique ?
                            </h3>
                            <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
                                Notre équipe académique est là pour vous accompagner dans vos recherches
                                et vous guider vers les ressources les plus pertinentes pour vos travaux.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {/* Bouton Contacter un conseiller */}
                                <button
                                    className="inline-flex items-center px-8 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02]"
                                    style={{ backgroundColor: primaryColor }}
                                    onClick={() => console.log('Action: Contacter conseiller')}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Contacter un conseiller académique
                                </button>
                                {/* Bouton Guide de rédaction */}
                                <button
                                    className="inline-flex items-center px-8 py-3 rounded-lg font-medium border-2 transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02]"
                                    style={{
                                        borderColor: secondaryColor,
                                        color: secondaryColor
                                    }}
                                    onClick={() => console.log('Action: Ouvrir guide de rédaction')}
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    Guide de rédaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Espace pour d'autres ressources d'aide ou FAQ */}
                <div className="mt-16 text-center">
                    <p className="text-gray-500">
                        Vous pouvez aussi consulter notre <a href="#" className="font-semibold" style={{ color: primaryColor }}>FAQ complète</a> pour les questions fréquentes.
                    </p>
                </div>
            </div>

            {/* Le composant Footer est maintenant mocké localement */}
            <Footer />
        </div>
    );
};

export default AidePage;