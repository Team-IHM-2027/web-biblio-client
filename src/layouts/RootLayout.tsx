// src/layouts/RootLayout.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/layout/Header.tsx';
import Footer from '../components/layout/Footer.tsx';
import { ChatAssistant } from '../components/ChatAssistant/ChatAssistant.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

const RootLayout = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Get the auth context

  // Extract values safely (they will be null if AuthProvider is missing)
  const currentUser = auth?.currentUser || null;

  useEffect(() => {
    // Check if user is blocked from localStorage
    const blockStatus = localStorage.getItem('userBlockStatus');
    if (blockStatus) {
      try {
        const parsed = JSON.parse(blockStatus);
        if (parsed.isBlocked && window.location.pathname !== '/blocked') {
          navigate('/blocked', { replace: true });
          return;
        }
      } catch (e) {
        console.error('Error parsing block status:', e);
      }
    }

    // Also check if currentUser has been set and is blocked
    if (currentUser && currentUser.etat === 'bloc' && window.location.pathname !== '/blocked') {
      navigate('/blocked', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="">
      <Header />
      <main className="flex-grow mx-auto">
        <Outlet />
      </main>
      {/* <Footer /> */}
      <ChatAssistant
        position="bottom-right"
        welcomeMessage="Bonjour! Je suis votre assistant de bibliothèque. Comment puis-je vous aider aujourd'hui ?"
        primaryColor="#2563eb"
      />
    </div>
  );
};

export default RootLayout;