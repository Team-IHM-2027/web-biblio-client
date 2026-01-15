import React, { useState } from 'react';
import { useClientAlerts } from '../../hooks/useClientAlerts';

const ClientAlertModal: React.FC = () => {
    const { activeAlert, acknowledgeAlert } = useClientAlerts();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!activeAlert) return null;

    const handleClose = () => {
        if (!activeAlert.id || isSubmitting) return;
        setIsSubmitting(true);
        try {
            acknowledgeAlert(activeAlert.id);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-4 ring-red-400/60 animate-pulse">
                <div className="h-2 w-full rounded-t-2xl bg-red-500" />
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {activeAlert.title || 'Information importante'}
                    </h2>
                    <p className="mt-3 text-gray-700">
                        {activeAlert.message || 'Bonjour, une mise a jour vient d\'etre effectuee dans la bibliotheque.'}
                    </p>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleClose}
                            className="rounded-md bg-red-600 px-5 py-2 text-white shadow hover:bg-red-700 disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientAlertModal;
