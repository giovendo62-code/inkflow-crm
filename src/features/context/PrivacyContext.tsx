import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PrivacyContextType {
    showFinancials: boolean;
    toggleFinancials: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
    const [showFinancials, setShowFinancials] = useState(() => {
        try {
            const saved = localStorage.getItem('inkflow_show_financials');
            // Check strictly for "undefined" string which can happen with bad saves
            if (saved === 'undefined') return true;
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            console.warn('PrivacyContext: Failed to parse inkflow_show_financials, defaulting to true', e);
            return true;
        }
    });

    const toggleFinancials = () => {
        setShowFinancials(prev => {
            const newVal = !prev;
            localStorage.setItem('inkflow_show_financials', JSON.stringify(newVal));
            return newVal;
        });
    };

    return (
        <PrivacyContext.Provider value={{ showFinancials, toggleFinancials }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
}
