// src/pages/ErrorPage.tsx
import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Oups !</h1>
      <p className="text-gray-600 mb-6">
        {error instanceof Error ? error.message : 'Une erreur est survenue'}
      </p>
      <button
        onClick={() => navigate('/dashboard/messages')}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux conversations
      </button>
    </div>
  );
};

export default ErrorPage;