import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import useAuth from '../../hooks/useAuth';

const LoginPage = () => {
    const { login, isAuthenticated, isLoading, error, user, setError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || '/dashboard'; // Default to dashboard

    // const handleSubmit = async (event) => {
    //     event.preventDefault();
    //     setError(null); // Clear previous errors
    //     const success = await login(email, password);
    //     // Navigation is handled by the effect below checking isAuthenticated and role
    // };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null); // Clear previous errors
        // Remove the assignment to 'success'
        await login(email, password);
        // Navigation is handled by the useEffect hook
    };

    // Effect to handle redirection after login state changes
     React.useEffect(() => {
        if (isAuthenticated) {
            if (user?.role === 'admin') {
                 console.log("Admin logged in, navigating to:", from);
                 navigate(from, { replace: true });
             } else {
                 // Logged in but not admin, redirect to an unauthorized page or back to login
                 console.warn("User logged in is not an admin.");
                 // Consider logging them out automatically or showing specific message
                 // For now, just redirect to a placeholder page
                 navigate('/unauthorized', { replace: true });
             }
        }
    }, [isAuthenticated, user, navigate, from]);

    // If already authenticated as admin, redirect away from login
    if (isAuthenticated && user?.role === 'admin') {
        return <Navigate to={from} replace />;
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <LockOutlinedIcon sx={{ m: 1, bgcolor: 'secondary.main', p: 1, borderRadius: '50%', color: 'white' }} />
                <Typography component="h1" variant="h5">
                    Admin Panel Sign in
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {/* Add Remember Me checkbox if needed */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                    {/* Add Forgot Password link later */}
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;