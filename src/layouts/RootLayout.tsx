import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header.tsx';
import Footer from '../components/layout/Footer.tsx';
import { ChatAssistant } from '../components/ChatAssistant/ChatAssistant.tsx';

const RootLayout = () => {
  return (
    <div className="">
      <Header />
      <main className="flex-grow  mx-auto ">
        <Outlet />
      </main>
      <Footer />
      <ChatAssistant 
        position="bottom-right"
        welcomeMessage="Bonjour! Je suis votre assistant de bibliothèque. Comment puis-je vous aider aujourd'hui ?"
        primaryColor="#2563eb"
      />

    </div>
  );
};

export default RootLayout;
