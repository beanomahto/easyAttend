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
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { createProfessor } from "../../api/professorApi"; // Adjust path

const ProfessorCreatePage = () => {
  const [facultyId, setfacultyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createProfessor({
        facultyId,
        firstName,
        lastName,
        email,
        password,
        department,
      });
      setSuccessOpen(true);
      // Automatically navigate back after a short delay
      setTimeout(() => {
        navigate("/professors"); // Navigate back to the list page
      }, 1500); // Delay in ms
    } catch (err) {
      console.error("Failed to create professor:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create professor."
      );
      setLoading(false);
    }
    // No need to set loading false on success due to navigation
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccessOpen(false);
  };

  return (
    <Container maxWidth="md">
      {/* Breadcrumbs for navigation context */}
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
          to="/professors"
        >
          Professors
        </Link>
        <Typography color="text.primary">Create New Professor</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add New Professor
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="facultyId"
            label="facultyId"
            name="facultyId"
            autoFocus
            value={facultyId}
            onChange={(e) => setfacultyId(e.target.value.toUpperCase())} // Force uppercase
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="firstName"
            label="firstName"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="lastName"
            label="lastName"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="department"
            label="department"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="email"
            label="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Box sx={{ mt: 3, position: "relative" }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                loading ||
                !facultyId ||
                !firstName ||
                !lastName ||
                !email ||
                !password
              } // Disable if loading or fields empty
            >
              {loading ? <CircularProgress size={24} /> : "Create professor"}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={successOpen}
        autoHideDuration={6000} // Longer duration as navigation happens
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          professor created successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfessorCreatePage;
