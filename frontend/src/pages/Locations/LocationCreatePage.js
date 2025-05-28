// import React, { useState } from 'react';
// import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import {
//     Container, Typography, Box, TextField, Button, CircularProgress,
//     Snackbar, Alert, Paper, Breadcrumbs, Link, Grid
// } from '@mui/material';
// import NavigateNextIcon from '@mui/icons-material/NavigateNext';
// import { createLocation } from '../../api/locationApi'; // Adjust path

// const LocationCreatePage = () => {
//     const [formData, setFormData] = useState({
//         name: '',
//         building: '',
//         latitude: '',
//         longitude: '',
//         radiusMeters: 30, // Default radius
//         trustedWifiBSSIDs: '' // Store as comma-separated string for input
//     });
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [successOpen, setSuccessOpen] = useState(false);
//     const navigate = useNavigate();

//     const handleChange = (event) => {
//         const { name, value } = event.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//      const handleNumberChange = (event) => {
//         const { name, value } = event.target;
//         // Allow empty string or valid numbers (positive for radius, any for coords)
//         if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
//              // For radius, ensure it's not negative if needed (can add validation on submit)
//              if (name === 'radiusMeters' && parseFloat(value) < 0) return;
//              setFormData(prev => ({ ...prev, [name]: value }));
//         }
//     };

//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         setLoading(true);
//         setError(null);

//         // Basic Frontend Validation
//         const latNum = parseFloat(formData.latitude);
//         const lonNum = parseFloat(formData.longitude);
//         const radNum = parseInt(formData.radiusMeters, 10);

//         if (!formData.name || isNaN(latNum) || isNaN(lonNum) || isNaN(radNum) || radNum <= 0) {
//             setError("Please fill in Name, valid Latitude/Longitude, and a positive Radius.");
//             setLoading(false);
//             return;
//         }
//          if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
//              setError("Invalid Latitude (-90 to 90) or Longitude (-180 to 180).");
//              setLoading(false);
//              return;
//          }

//         // Prepare data for API
//         const apiData = {
//             name: formData.name,
//             building: formData.building,
//             latitude: latNum,
//             longitude: lonNum,
//             radiusMeters: radNum,
//             // Split comma-separated BSSIDs, trim whitespace, filter empty strings
//             trustedWifiBSSIDs: formData.trustedWifiBSSIDs.split(',')
//                                 .map(s => s.trim())
//                                 .filter(Boolean)
//         };

//         try {
//             await createLocation(apiData);
//             setSuccessOpen(true);
//             setTimeout(() => {
//                 navigate('/locations');
//             }, 1500);
//         } catch (err) {
//             console.error("Failed to create location:", err);
//             setError(err.response?.data?.message || err.message || "Failed to create location.");
//             setLoading(false);
//         }
//     };

//     const handleCloseSnackbar = (event, reason) => {
//         if (reason === 'clickaway') return;
//         setSuccessOpen(false);
//     };

//     return (
//         <Container maxWidth="md">
//             <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
//                 <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">Dashboard</Link>
//                 <Link component={RouterLink} underline="hover" color="inherit" to="/locations">Locations</Link>
//                 <Typography color="text.primary">Create New Location</Typography>
//             </Breadcrumbs>

//             <Paper elevation={3} sx={{ p: 4 }}>
//                 <Typography variant="h5" component="h1" gutterBottom>
//                     Add New Location
//                 </Typography>
//                 <Box component="form" onSubmit={handleSubmit} noValidate>
//                     {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//                     <Grid container spacing={2}>
//                          <Grid item xs={12} sm={6}>
//                             <TextField name="name" label="Location Name (e.g., Room 101)" value={formData.name} onChange={handleChange} required fullWidth disabled={loading} />
//                          </Grid>
//                          <Grid item xs={12} sm={6}>
//                             <TextField name="building" label="Building (Optional)" value={formData.building} onChange={handleChange} fullWidth disabled={loading} />
//                          </Grid>
//                           <Grid item xs={12} sm={4}>
//                             <TextField name="longitude" label="Longitude" type="text" inputMode='decimal' value={formData.longitude} onChange={handleNumberChange} required fullWidth disabled={loading} helperText="e.g., -74.0060" />
//                          </Grid>
//                          <Grid item xs={12} sm={4}>
//                             <TextField name="latitude" label="Latitude" type="text" inputMode='decimal' value={formData.latitude} onChange={handleNumberChange} required fullWidth disabled={loading} helperText="e.g., 40.7128" />
//                          </Grid>
//                           <Grid item xs={12} sm={4}>
//                             <TextField name="radiusMeters" label="Radius (meters)" type="text" inputMode='numeric' value={formData.radiusMeters} onChange={handleNumberChange} required fullWidth disabled={loading} />
//                          </Grid>
//                          <Grid item xs={12}>
//                              <TextField
//                                 name="trustedWifiBSSIDs"
//                                 label="Trusted WiFi BSSIDs (Optional, comma-separated)"
//                                 placeholder="e.g., aa:bb:cc:11:22:33, 44:55:66:dd:ee:ff"
//                                 value={formData.trustedWifiBSSIDs}
//                                 onChange={handleChange}
//                                 fullWidth
//                                 multiline
//                                 rows={2}
//                                 disabled={loading}
//                              />
//                          </Grid>
//                     </Grid>
//                     <Box sx={{ mt: 3, position: 'relative' }}>
//                         <Button type="submit" fullWidth variant="contained" disabled={loading}>
//                             {loading ? <CircularProgress size={24} /> : 'Create Location'}
//                         </Button>
//                     </Box>
//                 </Box>
//             </Paper>
//             <Snackbar open={successOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>Location created successfully! Redirecting...</Alert>
//             </Snackbar>
//         </Container>
//     );
// };

// export default LocationCreatePage;

import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Breadcrumbs,
  Link,
  Grid,
  FormHelperText,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { createLocation } from "../../api/locationApi"; // Adjust path

const LocationCreatePage = () => {
  console.log("hello");
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    // Store polygon coordinates as a string for multiline TextField input
    polygonCoordinatesString: "",
    trustedWifiBSSIDs: "", // Store as comma-separated string for input
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // No longer need handleNumberChange specifically for lat/lng/radius

  const parsePolygonCoordinates = (coordsString) => {
    if (!coordsString || coordsString.trim() === "") return [];
    // Try to split by newline, then by semicolon, then by comma for pairs
    const pairs = coordsString.split(/\s*[\n;]\s*/).filter(Boolean);
    return pairs.map((pairStr) => {
      const P = pairStr.split(/\s*,\s*/);
      if (P.length !== 2)
        throw new Error(
          `Invalid coordinate pair format: "${pairStr}". Expected "lng,lat".`
        );
      const lng = parseFloat(P[0]);
      const lat = parseFloat(P[1]);
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error(`Invalid numbers in coordinate pair: "${pairStr}".`);
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(
          `Coordinates out of bounds in pair: "${pairStr}". Lng (-180 to 180), Lat (-90 to 90).`
        );
      }
      return [lng, lat]; // GeoJSON order: [longitude, latitude]
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let parsedPolygonCoordinates;
    try {
      parsedPolygonCoordinates = parsePolygonCoordinates(
        formData.polygonCoordinatesString
      );

      if (!formData.name.trim()) {
        throw new Error("Location Name is required.");
      }
      if (parsedPolygonCoordinates.length < 4) {
        throw new Error(
          "Polygon requires at least 4 points (first and last must be the same to close it)."
        );
      }
      // Check if polygon is closed (first and last points are identical)
      const firstPoint = JSON.stringify(parsedPolygonCoordinates[0]);
      const lastPoint = JSON.stringify(
        parsedPolygonCoordinates[parsedPolygonCoordinates.length - 1]
      );
      if (firstPoint !== lastPoint) {
        throw new Error(
          "Polygon is not closed. The first and last coordinate pairs must be identical."
        );
      }
    } catch (parseError) {
      setError(parseError.message);
      setLoading(false);
      return;
    }

    // Prepare data for API (uses the structure from the updated locationApi.js)
    const apiData = {
      name: formData.name.trim(),
      building: formData.building.trim(),
      polygonCoordinates: parsedPolygonCoordinates,
      trustedWifiBSSIDs: formData.trustedWifiBSSIDs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      await createLocation(apiData); // createLocation API function expects this structure now
      setSuccessOpen(true);
      setTimeout(() => {
        // Navigate to the locations list or the detail page of the created location
        navigate("/admin/locations"); // Or wherever your locations list is
      }, 1500);
    } catch (err) {
      console.error("Failed to create location:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create location."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSuccessOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link
          component={RouterLink}
          underline="hover"
          color="inherit"
          to="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          underline="hover"
          color="inherit"
          to="/admin/locations"
        >
          Locations
        </Link>
        <Typography color="text.primary">
          Create New Location (Polygon)
        </Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add New Location with Polygon Geofence
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={3}>
            {" "}
            {/* Increased spacing a bit */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Location Name (e.g., Main Hall)"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
                error={!!(error && error.toLowerCase().includes("name"))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="building"
                label="Building (Optional)"
                value={formData.building}
                onChange={handleChange}
                fullWidth
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="polygonCoordinatesString"
                label="Polygon Coordinates (Longitude, Latitude pairs)"
                multiline
                rows={6} // Adjust rows as needed
                value={formData.polygonCoordinatesString}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
                placeholder="Example:
-73.9878, 40.7577
-73.9870, 40.7580
-73.9875, 40.7585
-73.9883, 40.7582
-73.9878, 40.7577 (must close polygon)"
                error={
                  !!(
                    error &&
                    (error.toLowerCase().includes("polygon") ||
                      error.toLowerCase().includes("coordinate"))
                  )
                }
              />
              <FormHelperText>
                Enter each [Longitude, Latitude] pair on a new line or separate
                by semicolons. The first and last pair must be identical to form
                a closed polygon. At least 4 pairs are required.
              </FormHelperText>
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
          <Box sx={{ mt: 3, position: "relative" }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create Location"}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={successOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Location created successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LocationCreatePage;
