//

import React, { useState, useEffect, useCallback } from "react";
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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  getStudentSemesters,
  getStudentBranchesBySemester,
  getStudentsBySemesterAndBranchFilter,
} from "../../api/userApi"; // Ensure this path is correct
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Ensure this path is correct

const StudentListPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState(null);

  // Fetch available semesters on mount
  useEffect(() => {
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      setError(null);
      try {
        const response = await getStudentSemesters();
        setSemesters(response.data || []); // response.data should be an array of semesters
      } catch (err) {
        console.error("Failed to fetch semesters:", err);
        setError(
          "Failed to load semester options. " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoadingSemesters(false);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch available branches when a semester is selected
  useEffect(() => {
    if (selectedSemester) {
      const fetchBranches = async () => {
        setLoadingBranches(true);
        setError(null);
        setBranches([]);
        try {
          const response = await getStudentBranchesBySemester(selectedSemester);
          setBranches(response.data || []); // response.data should be an array of branches
        } catch (err) {
          console.error(
            "Failed to fetch branches for semester:",
            selectedSemester,
            err
          );
          setError(
            `Failed to load branch options for Semester ${selectedSemester}. ` +
              (err.response?.data?.message || err.message)
          );
        } finally {
          setLoadingBranches(false);
        }
      };
      fetchBranches();
    } else {
      setBranches([]);
    }
  }, [selectedSemester]);

  // Fetch students when both semester and branch are selected
  const fetchStudentsList = useCallback(async () => {
    if (selectedSemester && selectedBranch) {
      setLoadingStudents(true);
      setError(null);
      setStudents([]);
      try {
        const response = await getStudentsBySemesterAndBranchFilter(
          selectedSemester,
          selectedBranch
        );
        setStudents(response.data.data || response.data || []); // Adjust based on actual API response
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(
          "Failed to load students. " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoadingStudents(false);
      }
    } else {
      setStudents([]);
    }
  }, [selectedSemester, selectedBranch]);

  useEffect(() => {
    fetchStudentsList();
  }, [fetchStudentsList]);

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
    setSelectedBranch("");
    setStudents([]);
  };

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
    setStudents([]);
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
          Manage Students
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/students/create"
        >
          Add Student
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom component="div">
          Filter Students
        </Typography>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loadingSemesters}>
              <InputLabel id="semester-select-label">
                Select Semester
              </InputLabel>
              <Select
                labelId="semester-select-label"
                value={selectedSemester}
                label="Select Semester"
                onChange={handleSemesterChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {semesters.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </Select>
              {loadingSemesters && (
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Loading semesters...
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              disabled={!selectedSemester || loadingBranches}
            >
              <InputLabel id="branch-select-label">Select Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                value={selectedBranch}
                label="Select Branch"
                onChange={handleBranchChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
              {loadingBranches && (
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Loading branches...
                </Typography>
              )}
              {!selectedSemester && !loadingBranches && (
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Please select a semester first.
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loadingStudents && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <LoadingSpinner />
        </Box>
      )}

      {!loadingStudents && selectedSemester && selectedBranch && (
        <Paper elevation={3}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="students table">
              <TableHead sx={{ backgroundColor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Student ID
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    First Name
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Last Name
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Section
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    branch
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Semester
                  </TableCell>
                  <TableCell sx={{ color: "common.white", fontWeight: "bold" }}>
                    Registered
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No students found for Semester {selectedSemester}, Branch:{" "}
                      {selectedBranch}.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>{student.studentId || "-"}</TableCell>
                      <TableCell>{student.firstName}</TableCell>
                      <TableCell>{student.lastName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.section || "-"}</TableCell>
                      <TableCell>{student.branch}</TableCell>
                      <TableCell>{student.currentSemester}</TableCell>
                      <TableCell>
                        {new Date(
                          student.createdAt || student.registeredAt
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {!loadingStudents &&
        (!selectedSemester || !selectedBranch) &&
        students.length === 0 && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
            Please select both semester and branch to view students.
          </Typography>
        )}
    </Container>
  );
};

export default StudentListPage;
