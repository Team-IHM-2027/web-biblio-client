import { useEffect, useState } from 'react';
import { ChevronDown, ArrowRight, LogIn, Book, Users, Clock, GraduationCap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { useConfig } from '../../contexts/ConfigContext';
import { db } from '../../configs/firebase';
import heroImage from "../../assets/images/home/hero_image.jpg"
import book1 from "../../assets/images/home/book1.jpg"
import book2 from "../../assets/images/home/book2.jpg"
import book3 from "../../assets/images/home/book3.jpg"

const UniversityHero = () => {
    const [scrollY, setScrollY] = useState(0);
    const [stats, setStats] = useState({
        books: 0,
        theses: 0,
        students: 0,
        teachers: 0,
        loading: true
    });

    const { orgSettings } = useConfig();

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Récupérer les livres
                const booksSnapshot = await getDocs(collection(db, 'BiblioBooks'));
                const booksCount = booksSnapshot.size;

                // Récupérer les mémoires
                const thesesSnapshot = await getDocs(collection(db, 'BiblioThesis'));
                const thesesCount = thesesSnapshot.size;

                // Récupérer les utilisateurs et compter étudiants/enseignants
                const usersSnapshot = await getDocs(collection(db, 'BiblioUser'));
                let studentsCount = 0;
                let teachersCount = 0;

                usersSnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.statut === 'etudiant') {
                        studentsCount++;
                    } else if (userData.statut === 'enseignant') {
                        teachersCount++;
                    }
                });

                setStats({
                    books: booksCount,
                    theses: thesesCount,
                    students: studentsCount,
                    teachers: teachersCount,
                    loading: false
                });
            } catch (error) {
                console.error('Erreur lors du chargement des statistiques:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, []);

    const primaryColor = orgSettings?.Theme?.Primary || '#ff8c00';
    const secondaryColor = '#1b263b';
    const organizationName = orgSettings?.Name || 'BiblioENSPY';

    return (
        <div
            className="relative min-h-[130vh] flex items-center justify-center overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}e6 50%, ${primaryColor}b3 100%)`
            }}
        >
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute top-0 left-0 w-96 h-96 opacity-10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                ></div>
                <div
                    className="absolute bottom-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3 animate-pulse"
                    style={{ backgroundColor: primaryColor, animationDelay: '2s' }}
                ></div>

                {/* University pattern overlay */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 text-white opacity-5 transform rotate-12">
                        <GraduationCap size={120} />
                    </div>
                    <div className="absolute top-40 right-32 text-white opacity-5 transform -rotate-12">
                        <Book size={80} />
                    </div>
                    <div className="absolute bottom-32 left-32 text-white opacity-5 transform rotate-45">
                        <Users size={100} />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                    <div className="w-full lg:w-1/2 text-center lg:text-left">
                        <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 transform hover:scale-105 transition-transform duration-300">
                            <span className="text-white/90 font-medium text-sm flex items-center justify-center lg:justify-start">
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Bibliothèque Universitaire • {organizationName}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Votre porte d'entrée vers{' '}
                            <span
                                className="relative inline-block animate-pulse"
                                style={{ color: primaryColor }}
                            >
                                l'excellence
                                <div className="absolute bottom-0 left-0 w-full h-3 bg-white opacity-20 transform -skew-x-12"></div>
                            </span>{' '}
                            académique
                        </h1>

                        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                            Explorez notre riche collection de ressources académiques,
                            réservez vos ouvrages en ligne et construisez votre parcours
                            vers la réussite universitaire.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-12">
                            <a
                                href="/catalogue"
                                className="group bg-white text-gray-800 py-4 px-8 rounded-xl font-semibold transition-all duration-300 shadow-xl flex items-center justify-center transform hover:scale-105 hover:shadow-2xl"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = primaryColor;
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = '#1f2937';
                                }}
                            >
                                <Book className="h-5 w-5 mr-2" />
                                Explorer le catalogue
                                <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                            </a>

                            <a
                                href="/auth"
                                className="bg-transparent border-2 border-white text-white py-4 px-8 rounded-xl font-semibold transition-all duration-300 shadow-xl flex items-center justify-center hover:bg-white transform hover:scale-105"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = secondaryColor;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'white';
                                }}
                            >
                                <LogIn className="h-5 w-5 mr-2" />
                                Accéder à mon compte
                            </a>
                        </div>

                        {/* Quick Stats with Real Data */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl transform hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center justify-center mb-2">
                                    <Book className="h-6 w-6" style={{ color: primaryColor }} />
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-xl text-white">
                                        {stats.loading ? (
                                            <div className="animate-pulse bg-white/20 h-6 w-12 rounded mx-auto"></div>
                                        ) : (
                                            `${stats.books.toLocaleString()}+`
                                        )}
                                    </div>
                                    <div className="text-white/80 text-xs">Livres</div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl transform hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center justify-center mb-2">
                                    <GraduationCap className="h-6 w-6" style={{ color: primaryColor }} />
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-xl text-white">
                                        {stats.loading ? (
                                            <div className="animate-pulse bg-white/20 h-6 w-12 rounded mx-auto"></div>
                                        ) : (
                                            `${stats.theses.toLocaleString()}+`
                                        )}
                                    </div>
                                    <div className="text-white/80 text-xs">Mémoires</div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl transform hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center justify-center mb-2">
                                    <Users className="h-6 w-6" style={{ color: primaryColor }} />
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-xl text-white">
                                        {stats.loading ? (
                                            <div className="animate-pulse bg-white/20 h-6 w-12 rounded mx-auto"></div>
                                        ) : (
                                            `${stats.students.toLocaleString()}+`
                                        )}
                                    </div>
                                    <div className="text-white/80 text-xs">Étudiants</div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl transform hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center justify-center mb-2">
                                    <Clock className="h-6 w-6" style={{ color: primaryColor }} />
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-xl text-white">24/7</div>
                                    <div className="text-white/80 text-xs">En ligne</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Avec vraies images comme le premier composant */}
                    <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
                        <div className="relative">
                            {/* Main book showcase avec vraie image */}
                            <div
                                className="relative z-10 rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20 backdrop-blur-sm transform hover:scale-105 transition-transform duration-500"
                                style={{ transform: `perspective(1000px) rotateY(${scrollY * 0.02}deg) rotateX(${scrollY * 0.01}deg)` }}
                            >
                                <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/30 backdrop-blur-sm p-3">
                                    {/* Image placeholder with modern design */}
                                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                                        <img
                                            src={heroImage}
                                            alt="Bibliothèque universitaire"
                                            className="w-full h-full object-cover rounded-xl"
                                        />

                                        {/* Overlay gradient */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(to bottom, ${secondaryColor}30, ${secondaryColor}cc)`
                                            }}
                                        ></div>

                                        {/* Floating book elements avec vraies images */}
                                        <div className="absolute top-1/4 left-1/4 w-20 h-24 bg-white rounded shadow-lg transform -rotate-12 animate-float">
                                            <img src={book1} alt="Book cover" className="w-full h-full object-cover rounded" />
                                        </div>
                                        <div className="absolute top-1/3 right-1/4 w-20 h-24 bg-white rounded shadow-lg transform rotate-6 animate-float" style={{ animationDelay: '1.5s' }}>
                                            <img src={book2} alt="Book cover" className="w-full h-full object-cover rounded" />
                                        </div>
                                        <div className="absolute bottom-1/4 right-1/3 w-20 h-24 bg-white rounded shadow-lg transform -rotate-3 animate-float" style={{ animationDelay: '1s' }}>
                                            <img src={book3} alt="Book cover" className="w-full h-full object-cover rounded" />
                                        </div>

                                        {/* Text overlay adapté à l'université */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div
                                                className="text-white text-xl md:text-2xl font-bold px-6 py-4 rounded-lg backdrop-blur-sm shadow-lg border border-white/10 text-center"
                                                style={{ backgroundColor: `${secondaryColor}60` }}
                                            >
                                                <GraduationCap className="w-8 h-8 mx-auto mb-2" />
                                                {organizationName}
                                                <div className="text-sm mt-1 opacity-90">Excellence Académique</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div
                                className="absolute -top-10 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"
                                style={{ backgroundColor: primaryColor }}
                            ></div>
                            <div
                                className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20"
                                style={{ backgroundColor: secondaryColor }}
                            ></div>

                            {/* Floating book cards avec vraies images */}
                            <div
                                className="absolute -right-4 top-10 w-36 md:w-48 aspect-[2/3] bg-white rounded-lg shadow-xl overflow-hidden transform -rotate-6 hover:rotate-0 transition-transform duration-300"
                                style={{ transform: `rotate(-6deg) translateY(${scrollY * 0.05}px)` }}
                            >
                                <img src={book1} alt="Featured book" className="w-full h-full object-cover" />
                                <div
                                    className="absolute bottom-0 left-0 right-0 text-white p-2 text-sm font-medium"
                                    style={{ backgroundColor: `${secondaryColor}cc` }}
                                >
                                    Référence
                                </div>
                            </div>

                            <div
                                className="absolute -left-4 bottom-10 w-36 md:w-48 aspect-[2/3] bg-white rounded-lg shadow-xl overflow-hidden transform rotate-6 hover:rotate-0 transition-transform duration-300"
                                style={{ transform: `rotate(6deg) translateY(${-scrollY * 0.03}px)` }}
                            >
                                <img src={book2} alt="Featured book" className="w-full h-full object-cover" />
                                <div
                                    className="absolute bottom-0 left-0 right-0 text-white p-2 text-sm font-medium"
                                    style={{ backgroundColor: `${primaryColor}cc` }}
                                >
                                    Mémoire
                                </div>
                            </div>

                            {/* Interactive dots */}
                            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 hidden md:block">
                                <div className="w-2 h-2 bg-white rounded-full mb-3 animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                                <div className="w-2 h-2 bg-white rounded-full mb-3 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
                                <div className="w-2 h-2 bg-white rounded-full mb-3 animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s', animationDuration: '3s' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
                    <path fill="#ffffff" fillOpacity="1" d="M0,224L60,218.7C120,213,240,203,360,186.7C480,171,600,149,720,160C840,171,960,213,1080,213.3C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                </svg>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                <button
                    onClick={() => document.getElementById('resources-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-12 h-12 rounded-full border-2 border-white/50 flex items-center justify-center cursor-pointer hover:border-white hover:bg-white/10 transition-all"
                >
                    <ChevronDown className="h-6 w-6 text-white" />
                </button>
            </div>

            {/* Style pour l'animation float */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(-12deg); }
                    50% { transform: translateY(-10px) rotate(-8deg); }
                    100% { transform: translateY(0px) rotate(-12deg); }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default UniversityHero;
