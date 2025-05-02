import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Adjust path

const UnauthorizedPage = () => {
    const { logout } = useAuth();
    return (
        <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h4" component="h1" gutterBottom color="error">
                Access Denied
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
                You do not have the necessary permissions to access this page.
            </Typography>
             <Button variant="outlined" onClick={logout}>
                Logout and Login Again
            </Button>
             <Button variant="contained" component={RouterLink} to="/dashboard" sx={{ ml: 2 }}>
                Go to Dashboard (if applicable)
            </Button>
        </Container>
    );
};

export default UnauthorizedPage;