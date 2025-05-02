import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getAllLocations } from '../../api/locationApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LocationListPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllLocations();
        setLocations(response.data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setError(err.response?.data?.message || err.message || "Failed to load locations.");
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1">
          Manage Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/locations/create"
        >
          Add Location
        </Button>
      </Box>

      {loading && <LoadingSpinner />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <Paper elevation={3}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="locations table">
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Building</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Coordinates (Lon, Lat)</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Radius (m)</TableCell>
                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Trusted WiFi BSSIDs</TableCell>
                  {/* Add Actions column later */}
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.length === 0 ? (
                     <TableRow><TableCell colSpan={5} align="center">No locations found.</TableCell></TableRow>
                ) : (
                    locations.map((loc) => (
                        <TableRow key={loc._id} hover>
                            <TableCell>{loc.name}</TableCell>
                            <TableCell>{loc.building || '-'}</TableCell>
                            <TableCell>
                                {loc.location?.coordinates ?
                                `${loc.location.coordinates[0].toFixed(5)}, ${loc.location.coordinates[1].toFixed(5)}`
                                : '-'}
                             </TableCell>
                            <TableCell>{loc.radiusMeters}</TableCell>
                            <TableCell>
                                {loc.trustedWifiBSSIDs && loc.trustedWifiBSSIDs.length > 0
                                    ? loc.trustedWifiBSSIDs.slice(0, 2).map(bssid => <Chip key={bssid} label={bssid} size="small" sx={{ mr: 0.5, mb: 0.5 }}/>) // Show first 2
                                    : '-'}
                                {loc.trustedWifiBSSIDs && loc.trustedWifiBSSIDs.length > 2 ? '...' : ''}
                            </TableCell>
                             {/* Add Actions Cell later */}
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default LocationListPage;