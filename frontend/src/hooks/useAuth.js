import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext'; // Adjust path if needed

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        // This error means you are trying to use the context
        // outside of where it's provided. Ensure your component
        // is wrapped by <AuthProvider> in App.js or index.js.
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default useAuth;