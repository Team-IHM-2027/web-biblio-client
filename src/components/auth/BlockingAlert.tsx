// src/components/auth/BlockingAlert.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

interface BlockingAlertProps {
  isOpen: boolean;
  reason?: string;
  onClose?: () => void;
  onLogout?: () => Promise<void>;
}

const BlockingAlert: React.FC<BlockingAlertProps> = ({
  isOpen,
  reason = 'Accès suspendu',
  onClose,
  onLogout
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      if (onLogout) {
        await onLogout();
      }
      
      localStorage.removeItem('userBlockStatus');
      navigate('/auth', { replace: true });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if logout fails
      navigate('/auth', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center">
          <div className="inline-block bg-white/20 p-3 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Compte Bloqué</h2>
          <p className="text-red-100 mt-2">Accès suspendu</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Reason */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r mb-6">
            <p className="text-amber-800">
              <strong>Raison :</strong> {reason}
            </p>
          </div>
          
          {/* Countdown Message */}
          <p className="text-gray-600 mb-4 text-sm">
            Vous serez automatiquement déconnecté dans{' '}
            <span className="font-bold text-red-600">{countdown}</span> secondes.
          </p>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium"
            >
              {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter maintenant'}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fermer
              </button>
            )}
          </div>
          
          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Si vous pensez que c'est une erreur, contactez l'administration de la bibliothèque.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockingAlert;