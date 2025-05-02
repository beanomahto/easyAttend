import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Box, TextField, Button, CircularProgress,
    Snackbar, Alert, Paper, Breadcrumbs, Link, Grid
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { createLocation } from '../../api/locationApi'; // Adjust path

const LocationCreatePage = () => {
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        latitude: '',
        longitude: '',
        radiusMeters: 30, // Default radius
        trustedWifiBSSIDs: '' // Store as comma-separated string for input
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

     const handleNumberChange = (event) => {
        const { name, value } = event.target;
        // Allow empty string or valid numbers (positive for radius, any for coords)
        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
             // For radius, ensure it's not negative if needed (can add validation on submit)
             if (name === 'radiusMeters' && parseFloat(value) < 0) return;
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        // Basic Frontend Validation
        const latNum = parseFloat(formData.latitude);
        const lonNum = parseFloat(formData.longitude);
        const radNum = parseInt(formData.radiusMeters, 10);

        if (!formData.name || isNaN(latNum) || isNaN(lonNum) || isNaN(radNum) || radNum <= 0) {
            setError("Please fill in Name, valid Latitude/Longitude, and a positive Radius.");
            setLoading(false);
            return;
        }
         if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
             setError("Invalid Latitude (-90 to 90) or Longitude (-180 to 180).");
             setLoading(false);
             return;
         }


        // Prepare data for API
        const apiData = {
            name: formData.name,
            building: formData.building,
            latitude: latNum,
            longitude: lonNum,
            radiusMeters: radNum,
            // Split comma-separated BSSIDs, trim whitespace, filter empty strings
            trustedWifiBSSIDs: formData.trustedWifiBSSIDs.split(',')
                                .map(s => s.trim())
                                .filter(Boolean)
        };

        try {
            await createLocation(apiData);
            setSuccessOpen(true);
            setTimeout(() => {
                navigate('/locations');
            }, 1500);
        } catch (err) {
            console.error("Failed to create location:", err);
            setError(err.response?.data?.message || err.message || "Failed to create location.");
            setLoading(false);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSuccessOpen(false);
    };

    return (
        <Container maxWidth="md">
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">Dashboard</Link>
                <Link component={RouterLink} underline="hover" color="inherit" to="/locations">Locations</Link>
                <Typography color="text.primary">Create New Location</Typography>
            </Breadcrumbs>

            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Add New Location
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                         <Grid item xs={12} sm={6}>
                            <TextField name="name" label="Location Name (e.g., Room 101)" value={formData.name} onChange={handleChange} required fullWidth disabled={loading} />
                         </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField name="building" label="Building (Optional)" value={formData.building} onChange={handleChange} fullWidth disabled={loading} />
                         </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField name="longitude" label="Longitude" type="text" inputMode='decimal' value={formData.longitude} onChange={handleNumberChange} required fullWidth disabled={loading} helperText="e.g., -74.0060" />
                         </Grid>
                         <Grid item xs={12} sm={4}>
                            <TextField name="latitude" label="Latitude" type="text" inputMode='decimal' value={formData.latitude} onChange={handleNumberChange} required fullWidth disabled={loading} helperText="e.g., 40.7128" />
                         </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField name="radiusMeters" label="Radius (meters)" type="text" inputMode='numeric' value={formData.radiusMeters} onChange={handleNumberChange} required fullWidth disabled={loading} />
                         </Grid>
                         <Grid item xs={12}>
                             <TextField
                                name="trustedWifiBSSIDs"
                                label="Trusted WiFi BSSIDs (Optional, comma-separated)"
                                placeholder="e.g., aa:bb:cc:11:22:33, 44:55:66:dd:ee:ff"
                                value={formData.trustedWifiBSSIDs}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={2}
                                disabled={loading}
                             />
                         </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, position: 'relative' }}>
                        <Button type="submit" fullWidth variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Create Location'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
            <Snackbar open={successOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>Location created successfully! Redirecting...</Alert>
            </Snackbar>
        </Container>
    );
};

export default LocationCreatePage;