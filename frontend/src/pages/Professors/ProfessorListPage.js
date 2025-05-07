import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getAllProfessorList } from "../../api/professorApi"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const ProfessorListPage = () => {
  const [Professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllProfessorList();
        setProfessors(response.data);
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
          to="/professors/create"
        >
          Add Professors
        </Button>
      </Box>

      {loading && <LoadingSpinner />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Paper elevation={3}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="Professors table">
              <TableHead sx={{ backgroundColor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    facultyId
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    firstName
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    lastName
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    email
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    password
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    department
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Created At
                  </TableCell>
                  {/* Add Actions column later if needed */}
                </TableRow>
              </TableHead>
              <TableBody>
                {Professors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No Professors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  Professors.map((Professor) => (
                    <TableRow
                      key={Professor._id} // Use _id from MongoDB
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      hover
                    >
                      <TableCell component="th" scope="row">
                        {Professor.facultyId}
                      </TableCell>
                      <TableCell>{Professor.firstName}</TableCell>
                      <TableCell>{Professor.lastName}</TableCell>
                      <TableCell>{Professor.email}</TableCell>
                      <TableCell>{Professor.password}</TableCell>
                      <TableCell>{Professor.department}</TableCell>
                      <TableCell>
                        {new Date(Professor.createdAt).toLocaleDateString()}
                      </TableCell>
                      {/* Add Actions Cell later (Edit/Delete buttons) */}
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

export default ProfessorListPage;
