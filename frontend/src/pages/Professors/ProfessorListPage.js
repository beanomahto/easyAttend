//

import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid, // Added for layout
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getAllProfessorList } from "../../api/professorApi"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const ProfessorListPage = () => {
  const [allProfessors, setAllProfessors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProfessorId, setSelectedProfessorId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllProfessorList();
        setAllProfessors(response.data || []); // Ensure it's an array
      } catch (err) {
        console.error("Failed to fetch Professors:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load Professors."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfessors();
  }, []);

  // Memoize the list of unique departments
  const uniqueDepartments = useMemo(() => {
    if (!Array.isArray(allProfessors)) return [];
    const departments = allProfessors
      .map((prof) => prof.department)
      .filter((dept, index, self) => dept && self.indexOf(dept) === index); // Get unique, non-empty departments
    return departments.sort(); // Sort them alphabetically
  }, [allProfessors]);

  // Memoize professors filtered by the selected department
  const professorsInSelectedDepartment = useMemo(() => {
    if (!selectedDepartment || !Array.isArray(allProfessors)) return [];
    return allProfessors.filter(
      (prof) => prof.department === selectedDepartment
    );
  }, [allProfessors, selectedDepartment]);

  // Get the fully selected professor object
  const selectedProfessorDetails = useMemo(() => {
    if (!selectedProfessorId || !Array.isArray(allProfessors)) return null;
    return allProfessors.find((prof) => prof._id === selectedProfessorId);
  }, [allProfessors, selectedProfessorId]);

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
    setSelectedProfessorId(""); // Reset professor selection when department changes
  };

  const handleProfessorNameChange = (event) => {
    setSelectedProfessorId(event.target.value);
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
          Manage Professors
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/professors/create" // Make sure this route exists
        >
          Add Professor
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
          {allProfessors.length === 0 ? (
            <Typography variant="subtitle1" align="center">
              No professors found. You can add a new professor using the button
              above.
            </Typography>
          ) : (
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="department-select-label">
                    Select Department
                  </InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={selectedDepartment}
                    label="Select Department"
                    onChange={handleDepartmentChange}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {uniqueDepartments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!selectedDepartment}>
                  <InputLabel id="professor-name-select-label">
                    Select Professor
                  </InputLabel>
                  <Select
                    labelId="professor-name-select-label"
                    value={selectedProfessorId}
                    label="Select Professor"
                    onChange={handleProfessorNameChange}
                    disabled={
                      !selectedDepartment ||
                      professorsInSelectedDepartment.length === 0
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {professorsInSelectedDepartment.map((prof) => (
                      <MenuItem key={prof._id} value={prof._id}>
                        {prof.firstName} {prof.lastName} ({prof.facultyId})
                      </MenuItem>
                    ))}
                  </Select>
                  {!selectedDepartment && (
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Please select a department first.
                    </Typography>
                  )}
                  {selectedDepartment &&
                    professorsInSelectedDepartment.length === 0 && (
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        No professors found in this department.
                      </Typography>
                    )}
                </FormControl>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {selectedProfessorDetails && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Professor Details: {selectedProfessorDetails.firstName}{" "}
            {selectedProfessorDetails.lastName}
          </Typography>
          <Typography>
            <strong>Faculty ID:</strong> {selectedProfessorDetails.facultyId}
          </Typography>
          <Typography>
            <strong>Email:</strong> {selectedProfessorDetails.email}
          </Typography>
          <Typography>
            <strong>Department:</strong>{" "}
            {selectedProfessorDetails.department || "-"}
          </Typography>
          <Typography>
            <strong>Registered On:</strong>{" "}
            {new Date(selectedProfessorDetails.createdAt).toLocaleDateString()}
          </Typography>
          {/* Password is intentionally omitted for security */}
          {/* Add Actions (Edit/Delete buttons) for the selectedProfessorDetails here */}
          {/* Example:
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" component={RouterLink} to={`/professors/edit/${selectedProfessorDetails._id}`}>Edit</Button>
              <Button variant="outlined" color="error" onClick={() => handleDelete(selectedProfessorDetails._id)}>Delete</Button>
            </Box>
          */}
        </Paper>
      )}
      {!loading &&
        !error &&
        !selectedProfessorDetails &&
        allProfessors.length > 0 && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
            Please select a department and then a professor to view details.
          </Typography>
        )}
    </Container>
  );
};

export default ProfessorListPage;
