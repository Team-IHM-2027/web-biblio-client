// src/pages/dashboard/CartPage.tsx
import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Book, ChevronLeft } from 'lucide-react';

// Définition des variables de couleur
const COLORS = {
  primary: '#ff8c00',    // Orange
  secondary: '#1b263b',  // Dark Blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  danger: '#ef4444',     // Red
};

// Type pour les items du panier
interface CartItem {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  quantity: number;
  inStock: boolean;
  type: 'physical' | 'digital';
}

// Données des items du panier
const cartItemsData: CartItem[] = [
  {
    id: 1,
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    coverImage: '/api/placeholder/200/300',
    price: 15.99,
    quantity: 1,
    inStock: true,
    type: 'physical'
  },
  {
    id: 2,
    title: 'Candide',
    author: 'Voltaire',
    coverImage: '/api/placeholder/200/300',
    price: 12.50,
    quantity: 1,
    inStock: true,
    type: 'physical'
  },
  {
    id: 3,
    title: 'Voyage au centre de la Terre (Édition numérique)',
    author: 'Jules Verne',
    coverImage: '/api/placeholder/200/300',
    price: 8.99,
    quantity: 1,
    inStock: true,
    type: 'digital'
  }
];

// Animation pour les transitions
const fadeTransition = "transition-all duration-300 ease-in-out";

// Composant CartItem pour afficher un livre dans le panier
const CartItemCard = ({ 
  item, 
  onQuantityChange, 
  onRemove 
}: { 
  item: CartItem; 
  onQuantityChange: (id: number, newQuantity: number) => void;
  onRemove: (id: number) => void;
}) => {
  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  const increaseQuantity = () => {
    onQuantityChange(item.id, item.quantity + 1);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 ${fadeTransition} hover:shadow-md`}>
      <div className="flex flex-col md:flex-row">
        {/* Image du livre */}
        <div className="md:w-1/6 p-4 flex items-center justify-center bg-gray-50">
          <div className="w-24 h-36 rounded-md overflow-hidden shadow-sm transform transition-transform duration-300 hover:scale-105">
            <img 
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Détails du livre */}
        <div className="md:w-5/6 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: COLORS.secondary }}>{item.title}</h3>
                <p className="text-gray-600">{item.author}</p>
              </div>
              <div 
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.type === 'digital' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-orange-100 text-orange-600'
                } ${fadeTransition}`}
              >
                {item.type === 'digital' ? 'Numérique' : 'Physique'}
              </div>
            </div>
            
            <div className="flex items-center mt-2">
              <Book size={16} className="text-gray-400 mr-1" />
              <span className={`text-sm ${item.inStock ? 'text-green-500' : 'text-red-500'}`}>
                {item.inStock ? 'En stock' : 'Rupture de stock'}
              </span>
            </div>
          </div>
          
          {/* Quantité et prix */}
          <div className="flex flex-col md:flex-row md:items-center mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-6">
            {/* Contrôles de quantité - seulement pour les livres physiques */}
            {item.type === 'physical' && (
              <div className="flex items-center">
                <button 
                  onClick={decreaseQuantity}
                  disabled={item.quantity <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-l-md ${fadeTransition} ${
                    item.quantity <= 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Minus size={16} />
                </button>
                <div className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-200">
                  {item.quantity}
                </div>
                <button 
                  onClick={increaseQuantity}
                  className={`w-8 h-8 flex items-center justify-center rounded-r-md bg-gray-100 text-gray-700 ${fadeTransition} hover:bg-gray-200`}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            
            {/* Prix */}
            <div className="text-right md:w-24">
              <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                {(item.price * item.quantity).toFixed(2)} €
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  {item.price.toFixed(2)} € chacun
                </p>
              )}
            </div>
            
            {/* Bouton supprimer */}
            <button 
              onClick={() => onRemove(item.id)}
              className={`p-2 rounded-full ${fadeTransition} hover:bg-red-50`}
              style={{ color: COLORS.danger }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant récapitulatif du panier
const CartSummary = ({ 
  items, 
  onCheckout 
}: { 
  items: CartItem[];
  onCheckout: () => void;
}) => {
  // Calculs pour le récapitulatif
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = items.some(item => item.type === 'physical') ? 3.99 : 0;
  const tax = subtotal * 0.2; // TVA 20%
  const total = subtotal + shipping + tax;
  
  const physicalCount = items.filter(item => item.type === 'physical')
    .reduce((sum, item) => sum + item.quantity, 0);
  const digitalCount = items.filter(item => item.type === 'digital').length;

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 sticky top-6 ${fadeTransition}`}>
      <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.secondary }}>Récapitulatif</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Sous-total ({items.length} articles)</span>
          <span className="font-medium">{subtotal.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">TVA (20%)</span>
          <span className="font-medium">{tax.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Frais de livraison</span>
          <span className="font-medium">{shipping.toFixed(2)} €</span>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span style={{ color: COLORS.primary }}>{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onCheckout}
        className={`w-full mt-6 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center ${fadeTransition} transform hover:scale-[1.02] active:scale-[0.98]`}
        style={{ 
          backgroundColor: COLORS.primary,
          boxShadow: `0 4px 14px 0 ${COLORS.primary}30`
        }}
      >
        <CreditCard size={18} className="mr-2" />
        Procéder au paiement
      </button>
      
      <div className="mt-6 space-y-2 text-sm text-gray-500">
        <div className="flex items-start">
          <div className="bg-orange-100 rounded-full p-1 mr-2 mt-0.5">
            <Book size={12} className="text-orange-500" />
          </div>
          <p>
            {physicalCount > 0 
              ? `${physicalCount} livre${physicalCount > 1 ? 's' : ''} physique${physicalCount > 1 ? 's' : ''} à livrer`
              : 'Aucun livre physique'
            }
          </p>
        </div>
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
            <Book size={12} className="text-blue-500" />
          </div>
          <p>
            {digitalCount > 0 
              ? `${digitalCount} livre${digitalCount > 1 ? 's' : ''} numérique${digitalCount > 1 ? 's' : ''} à télécharger`
              : 'Aucun livre numérique'
            }
          </p>
        </div>
      </div>
      
      {/* Badge de sécurité */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center">
          <div className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Paiement sécurisé
          </div>
        </div>
      </div>
    </div>
  );
};

// Bouton de suggestion de produit
const SuggestedProductButton = ({ title, price }: { title: string, price: number }) => {
  return (
    <div className={`p-4 border border-gray-100 rounded-lg shadow-sm bg-white flex items-center justify-between ${fadeTransition} hover:shadow-md cursor-pointer`}>
      <div>
        <h4 className="font-medium" style={{ color: COLORS.secondary }}>{title}</h4>
        <p className="text-sm" style={{ color: COLORS.primary }}>{price.toFixed(2)} €</p>
      </div>
      <button 
        className="p-2 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors"
        style={{ color: COLORS.primary }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

// Section d'articles suggérés
// const SuggestedProducts = () => {
//   return (
//     <div className="bg-white rounded-xl shadow-md p-6">
//       <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.secondary }}>Vous pourriez aimer</h3>
//       <div className="space-y-3">
//         <SuggestedProductButton title="Les Misérables" price={18.99} />
//         <SuggestedProductButton title="Notre-Dame de Paris" price={14.50} />
//         <SuggestedProductButton title="L'Étranger (Numérique)" price={7.99} />
//       </div>
//     </div>
//   );
// };

// Composant principal de la page du panier
const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(cartItemsData);

  // Gestionnaire de changement de quantité
  const handleQuantityChange = (id: number, newQuantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Gestionnaire de suppression d'un article
  const handleRemoveItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  // Gestionnaire de paiement
  const handleCheckout = () => {
    alert('Redirection vers la page de paiement...');
    // Logique de redirection vers la page de paiement
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          {/* Navigation secondaire */}
          <nav className="flex items-center text-sm mb-8">
            <a 
              href="/" 
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              Accueil
            </a>
            <span className="mx-2 text-gray-400">/</span>
            <a 
              href="/catalogue" 
              className="text-gray-500 hover:text-gray-700"
            >
              Catalogue
            </a>
            <span className="mx-2 text-gray-400">/</span>
            <span style={{ color: COLORS.primary }}>Panier</span>
          </nav>
          
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: COLORS.secondary }}>Mon Panier</h1>
              <p className="text-gray-500">
                {cartItems.length > 0 
                  ? `${cartItems.length} article${cartItems.length > 1 ? 's' : ''} dans votre panier`
                  : 'Votre panier est vide'
                }
              </p>
            </div>
            
            <a 
              href="/catalogue" 
              className={`flex items-center px-4 py-2 rounded-lg border border-blue-100 bg-blue-50 ${fadeTransition} hover:bg-blue-100`}
              style={{ color: COLORS.secondary }}
            >
              <ChevronLeft size={16} className="mr-1" />
              Continuer mes achats
            </a>
          </div>
          
          {/* Contenu principal */}
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste des articles */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map(item => (
                  <CartItemCard 
                    key={item.id} 
                    item={item} 
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
                
                {/* Section suggestions */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.secondary }}>Recommandations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SuggestedProductButton title="Les Misérables" price={18.99} />
                    <SuggestedProductButton title="Notre-Dame de Paris" price={14.50} />
                  </div>
                </div>
              </div>
              
              {/* Bloc latéral */}
              <div className="lg:col-span-1 space-y-6">
                {/* Résumé du panier */}
                <CartSummary items={cartItems} onCheckout={handleCheckout} />
                
                {/* Code promo */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.secondary }}>Code promo</h3>
                  <div className="flex">
                    <input 
                      type="text" 
                      placeholder="Entrez votre code"
                      className="flex-1 p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-orange-300"
                    />
                    <button 
                      className="px-4 py-2 rounded-r-md text-white"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`bg-white rounded-xl shadow-md p-10 text-center ${fadeTransition}`}>
              <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={36} style={{ color: COLORS.primary }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: COLORS.secondary }}>Votre panier est vide</h2>
              <p className="text-gray-600 mb-6">
                Explorez notre catalogue pour découvrir nos livres et ajouter des articles à votre panier.
              </p>
              <a 
                href="/catalogue"
                className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium ${fadeTransition} hover:shadow-lg`}
                style={{ backgroundColor: COLORS.primary }}
              >
                <Book size={18} className="mr-2" />
                Découvrir notre catalogue
              </a>
            </div>
          )}
          
          {/* Section d'aide */}
          <div className="mt-12 p-6 bg-gray-50 border border-gray-100 rounded-xl">
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.secondary }}>Besoin d'aide ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <div className="mr-3 p-2 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: COLORS.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold" style={{ color: COLORS.secondary }}>Diversité et disponibilité</h4>
                  <p className="text-sm text-gray-600">Une panoplie de livres et de memeores disponibles</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-3 p-2 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: COLORS.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold" style={{ color: COLORS.secondary }}>Recommandations</h4>
                  <p className="text-sm text-gray-600">Basées sur la popularité, sur vos lectures et votre entourage</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-3 p-2 rounded-full" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: COLORS.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold" style={{ color: COLORS.secondary }}>Support</h4>
                  <p className="text-sm text-gray-600">Assistance client disponible 7j/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;