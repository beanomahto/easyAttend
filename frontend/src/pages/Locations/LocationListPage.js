// // import React, { useState, useEffect } from 'react';
// // import { Link as RouterLink } from 'react-router-dom';
// // import {
// //   Container, Typography, Button, Box, Paper, Table, TableBody,
// //   TableCell, TableContainer, TableHead, TableRow, Alert, Chip
// // } from '@mui/material';
// // import AddIcon from '@mui/icons-material/Add';
// // import { getAllLocations } from '../../api/locationApi';
// // import LoadingSpinner from '../../components/common/LoadingSpinner';

// // const LocationListPage = () => {
// //   const [locations, setLocations] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchLocations = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         const response = await getAllLocations();
// //         setLocations(response.data);
// //       } catch (err) {
// //         console.error("Failed to fetch locations:", err);
// //         setError(err.response?.data?.message || err.message || "Failed to load locations.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchLocations();
// //   }, []);

// //   return (
// //     <Container maxWidth="lg">
// //       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
// //         <Typography variant="h4" component="h1">
// //           Manage Locations
// //         </Typography>
// //         <Button
// //           variant="contained"
// //           startIcon={<AddIcon />}
// //           component={RouterLink}
// //           to="/locations/create"
// //         >
// //           Add Location
// //         </Button>
// //       </Box>

// //       {loading && <LoadingSpinner />}
// //       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

// //       {!loading && !error && (
// //         <Paper elevation={3}>
// //           <TableContainer>
// //             <Table sx={{ minWidth: 650 }} aria-label="locations table">
// //               <TableHead sx={{ backgroundColor: 'primary.main' }}>
// //                 <TableRow>
// //                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
// //                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Building</TableCell>
// //                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Coordinates (Lon, Lat)</TableCell>
// //                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Radius (m)</TableCell>
// //                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Trusted WiFi BSSIDs</TableCell>
// //                   {/* Add Actions column later */}
// //                 </TableRow>
// //               </TableHead>
// //               <TableBody>
// //                 {locations.length === 0 ? (
// //                      <TableRow><TableCell colSpan={5} align="center">No locations found.</TableCell></TableRow>
// //                 ) : (
// //                     locations.map((loc) => (
// //                         <TableRow key={loc._id} hover>
// //                             <TableCell>{loc.name}</TableCell>
// //                             <TableCell>{loc.building || '-'}</TableCell>
// //                             <TableCell>
// //                                 {loc.location?.coordinates ?
// //                                 `${loc.location.coordinates[0].toFixed(5)}, ${loc.location.coordinates[1].toFixed(5)}`
// //                                 : '-'}
// //                              </TableCell>
// //                             <TableCell>{loc.radiusMeters}</TableCell>
// //                             <TableCell>
// //                                 {loc.trustedWifiBSSIDs && loc.trustedWifiBSSIDs.length > 0
// //                                     ? loc.trustedWifiBSSIDs.slice(0, 2).map(bssid => <Chip key={bssid} label={bssid} size="small" sx={{ mr: 0.5, mb: 0.5 }}/>) // Show first 2
// //                                     : '-'}
// //                                 {loc.trustedWifiBSSIDs && loc.trustedWifiBSSIDs.length > 2 ? '...' : ''}
// //                             </TableCell>
// //                              {/* Add Actions Cell later */}
// //                         </TableRow>
// //                     ))
// //                 )}
// //               </TableBody>
// //             </Table>
// //           </TableContainer>
// //         </Paper>
// //       )}
// //     </Container>
// //   );
// // };

// // export default LocationListPage;

// import React, { useState, useEffect } from "react";
// import { Link as RouterLink } from "react-router-dom";
// import {
//   Container,
//   Typography,
//   Button,
//   Box,
//   Paper,
//   Alert,
//   Chip,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import { getAllLocations } from "../../api/locationApi"; // Adjust path
// import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

// const LocationListPage = () => {
//   const [locations, setLocations] = useState([]);
//   const [selectedLocationId, setSelectedLocationId] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchLocations = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await getAllLocations();
//         setLocations(response.data);
//       } catch (err) {
//         console.error("Failed to fetch locations:", err);
//         setError(
//           err.response?.data?.message ||
//             err.message ||
//             "Failed to load locations."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchLocations();
//   }, []);

//   const handleLocationChange = (event) => {
//     setSelectedLocationId(event.target.value);
//   };

//   const selectedLocation = locations.find(
//     (loc) => loc._id === selectedLocationId
//   );

//   return (
//     <Container maxWidth="lg">
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mb: 4,
//           mt: 2,
//         }}
//       >
//         <Typography variant="h4" component="h1">
//           Manage Locations
//         </Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           component={RouterLink}
//           to="/locations/create"
//         >
//           Add Location
//         </Button>
//       </Box>

//       {loading && <LoadingSpinner />}
//       {error && (
//         <Alert severity="error" sx={{ mb: 2 }}>
//           {error}
//         </Alert>
//       )}

//       {!loading && !error && (
//         <Paper elevation={3} sx={{ p: 3 }}>
//           {locations.length === 0 ? (
//             <Typography variant="subtitle1" align="center">
//               No locations found. You can add a new location using the button
//               above.
//             </Typography>
//           ) : (
//             <FormControl fullWidth sx={{ mb: 2 }}>
//               <InputLabel id="location-select-label">
//                 Select a Location
//               </InputLabel>
//               <Select
//                 labelId="location-select-label"
//                 id="location-select"
//                 value={selectedLocationId}
//                 label="Select a Location"
//                 onChange={handleLocationChange}
//               >
//                 <MenuItem value="">
//                   <em>None</em>
//                 </MenuItem>
//                 {locations.map((loc) => (
//                   <MenuItem key={loc._id} value={loc._id}>
//                     {loc.name} {loc.building ? `(${loc.building})` : ""}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           )}

//           {selectedLocation && (
//             <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
//               <Typography variant="h6" component="h2" gutterBottom>
//                 Location Details
//               </Typography>
//               <Typography>
//                 <strong>Name:</strong> {selectedLocation.name}
//               </Typography>
//               <Typography>
//                 <strong>Building:</strong> {selectedLocation.building || "-"}
//               </Typography>
//               <Typography>
//                 <strong>Coordinates (Lon, Lat):</strong>
//                 {selectedLocation.location?.coordinates
//                   ? ` ${selectedLocation.location.coordinates[0].toFixed(
//                       5
//                     )}, ${selectedLocation.location.coordinates[1].toFixed(5)}`
//                   : " -"}
//               </Typography>
//               <Typography>
//                 <strong>Radius (m):</strong> {selectedLocation.radiusMeters}
//               </Typography>
//               <Typography component="div" sx={{ mt: 1 }}>
//                 {" "}
//                 {/* Using component="div" for proper structure with Box */}
//                 <strong>Trusted WiFi BSSIDs:</strong>
//                 {selectedLocation.trustedWifiBSSIDs &&
//                 selectedLocation.trustedWifiBSSIDs.length > 0 ? (
//                   <Box
//                     sx={{
//                       display: "flex",
//                       flexWrap: "wrap",
//                       gap: 0.5,
//                       mt: 0.5,
//                     }}
//                   >
//                     {selectedLocation.trustedWifiBSSIDs.map((bssid) => (
//                       <Chip key={bssid} label={bssid} size="small" />
//                     ))}
//                   </Box>
//                 ) : (
//                   " -" // Added space for consistency
//                 )}
//               </Typography>
//               {/* Add Actions for Edit/Delete later for the selectedLocation */}
//             </Paper>
//           )}
//         </Paper>
//       )}
//     </Container>
//   );
// };

// export default LocationListPage;

import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid, // Added for layout
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getAllLocations } from "../../api/locationApi"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const LocationListPage = () => {
  const [allLocations, setAllLocations] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllLocations();
        setAllLocations(response.data || []); // Ensure it's an array
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load locations."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Memoize the list of unique buildings
  const uniqueBuildings = useMemo(() => {
    if (!Array.isArray(allLocations)) return [];
    const buildings = allLocations
      .map((loc) => loc.building)
      .filter(
        (building, index, self) => building && self.indexOf(building) === index
      ); // Get unique, non-empty buildings
    return buildings.sort(); // Sort them alphabetically
  }, [allLocations]);

  // Memoize locations filtered by the selected building
  const locationsInSelectedBuilding = useMemo(() => {
    if (!selectedBuilding || !Array.isArray(allLocations)) return [];
    return allLocations.filter((loc) => loc.building === selectedBuilding);
  }, [allLocations, selectedBuilding]);

  // Get the fully selected location object
  const selectedLocationDetails = useMemo(() => {
    if (!selectedLocationId || !Array.isArray(allLocations)) return null;
    return allLocations.find((loc) => loc._id === selectedLocationId);
  }, [allLocations, selectedLocationId]);

  const handleBuildingChange = (event) => {
    setSelectedBuilding(event.target.value);
    setSelectedLocationId(""); // Reset location selection when building changes
  };

  const handleLocationNameChange = (event) => {
    setSelectedLocationId(event.target.value);
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          mt: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Manage Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/locations/create" // Make sure this route exists
        >
          Add Location
        </Button>
      </Box>

      {loading && <LoadingSpinner />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {allLocations.length === 0 ? (
            <Typography variant="subtitle1" align="center">
              No locations found. You can add a new location using the button
              above.
            </Typography>
          ) : (
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="building-select-label">
                    Select Building
                  </InputLabel>
                  <Select
                    labelId="building-select-label"
                    value={selectedBuilding}
                    label="Select Building"
                    onChange={handleBuildingChange}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {uniqueBuildings.map((building) => (
                      <MenuItem key={building} value={building}>
                        {building}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!selectedBuilding}>
                  <InputLabel id="location-name-select-label">
                    Select Location Name
                  </InputLabel>
                  <Select
                    labelId="location-name-select-label"
                    value={selectedLocationId}
                    label="Select Location Name"
                    onChange={handleLocationNameChange}
                    disabled={
                      !selectedBuilding ||
                      locationsInSelectedBuilding.length === 0
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {locationsInSelectedBuilding.map((loc) => (
                      <MenuItem key={loc._id} value={loc._id}>
                        {loc.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {!selectedBuilding && (
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Please select a building first.
                    </Typography>
                  )}
                  {selectedBuilding &&
                    locationsInSelectedBuilding.length === 0 && (
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        No locations found in this building.
                      </Typography>
                    )}
                </FormControl>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {selectedLocationDetails && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Location Details: {selectedLocationDetails.name}
          </Typography>
          <Typography>
            <strong>Building:</strong> {selectedLocationDetails.building || "-"}
          </Typography>
          <Typography>
            <strong>Coordinates (Lon, Lat):</strong>
            {selectedLocationDetails.location?.coordinates
              ? ` ${selectedLocationDetails.location.coordinates[0].toFixed(
                  5
                )}, ${selectedLocationDetails.location.coordinates[1].toFixed(
                  5
                )}`
              : " -"}
          </Typography>
          <Typography>
            <strong>Radius (m):</strong> {selectedLocationDetails.radiusMeters}
          </Typography>
          <Typography component="div" sx={{ mt: 1 }}>
            <strong>Trusted WiFi BSSIDs:</strong>
            {selectedLocationDetails.trustedWifiBSSIDs &&
            selectedLocationDetails.trustedWifiBSSIDs.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                {selectedLocationDetails.trustedWifiBSSIDs.map((bssid) => (
                  <Chip key={bssid} label={bssid} size="small" />
                ))}
              </Box>
            ) : (
              " -"
            )}
          </Typography>
          {/* Add Actions (Edit/Delete buttons) for the selectedLocationDetails here */}
          {/* Example:
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" component={RouterLink} to={`/locations/edit/${selectedLocationDetails._id}`}>Edit</Button>
              <Button variant="outlined" color="error" onClick={() => handleDelete(selectedLocationDetails._id)}>Delete</Button>
            </Box>
          */}
        </Paper>
      )}
      {!loading &&
        !error &&
        !selectedLocationDetails &&
        allLocations.length > 0 && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
            Please select a building and then a location to view details.
          </Typography>
        )}
    </Container>
  );
};

export default LocationListPage;
