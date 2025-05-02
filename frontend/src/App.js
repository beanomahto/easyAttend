import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext'; // Adjust path
import AppRoutes from './routes/AppRoutes'; // Adjust path
import theme from './styles/theme'; // Adjust path

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Apply baseline styling */}
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;