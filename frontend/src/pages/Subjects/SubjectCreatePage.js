import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Box, TextField, Button, CircularProgress,
    Snackbar, Alert, Paper, Breadcrumbs, Link
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { createSubject } from '../../api/subjectApi'; // Adjust path

const SubjectCreatePage = () => {
    const [subjectCode, setSubjectCode] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createSubject({ subjectCode, name });
            setSuccessOpen(true);
            // Automatically navigate back after a short delay
            setTimeout(() => {
                navigate('/subjects'); // Navigate back to the list page
            }, 1500); // Delay in ms
        } catch (err) {
            console.error("Failed to create subject:", err);
            setError(err.response?.data?.message || err.message || "Failed to create subject.");
            setLoading(false);
        }
        // No need to set loading false on success due to navigation
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSuccessOpen(false);
    };

    return (
        <Container maxWidth="md">
             {/* Breadcrumbs for navigation context */}
             <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
                    Dashboard
                </Link>
                 <Link component={RouterLink} underline="hover" color="inherit" to="/subjects">
                    Subjects
                </Link>
                <Typography color="text.primary">Create New Subject</Typography>
            </Breadcrumbs>

            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Add New Subject
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="subjectCode"
                        label="Subject Code (e.g., CS301)"
                        name="subjectCode"
                        autoFocus
                        value={subjectCode}
                        onChange={(e) => setSubjectCode(e.target.value.toUpperCase())} // Force uppercase
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="name"
                        label="Subject Name"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                    <Box sx={{ mt: 3, position: 'relative' }}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading || !subjectCode || !name} // Disable if loading or fields empty
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Subject'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
            <Snackbar
                open={successOpen}
                autoHideDuration={6000} // Longer duration as navigation happens
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Subject created successfully! Redirecting...
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default SubjectCreatePage;