// import React, { useState, useEffect } from 'react';
// import { Link as RouterLink } from 'react-router-dom';
// import {
//   Container, Typography, Button, Box, Paper, Table, TableBody,
//   TableCell, TableContainer, TableHead, TableRow, Alert
// } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add';
// import { getAllSubjects } from '../../api/subjectApi'; // Adjust path
// import LoadingSpinner from '../../components/common/LoadingSpinner'; // Adjust path

// const SubjectListPage = () => {
//   const [subjects, setSubjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await getAllSubjects();
//         setSubjects(response.data);
//       } catch (err) {
//         console.error("Failed to fetch subjects:", err);
//         setError(err.response?.data?.message || err.message || "Failed to load subjects.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSubjects();
//   }, []);

//   return (
//     <Container maxWidth="lg">
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>
//         <Typography variant="h4" component="h1">
//           Manage Subjects
//         </Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           component={RouterLink}
//           to="/subjects/create"
//         >
//           Add Subject
//         </Button>
//       </Box>

//       {loading && <LoadingSpinner />}
//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       {!loading && !error && (
//         <Paper elevation={3}>
//           <TableContainer>
//             <Table sx={{ minWidth: 650 }} aria-label="subjects table">
//               <TableHead sx={{ backgroundColor: 'primary.main' }}>
//                 <TableRow>
//                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Subject Code</TableCell>
//                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Subject Name</TableCell>
//                   <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Created At</TableCell>
//                   {/* Add Actions column later if needed */}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {subjects.length === 0 ? (
//                     <TableRow>
//                         <TableCell colSpan={3} align="center">No subjects found.</TableCell>
//                     </TableRow>
//                 ) : (
//                     subjects.map((subject) => (
//                         <TableRow
//                             key={subject._id} // Use _id from MongoDB
//                             sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
//                             hover
//                         >
//                             <TableCell component="th" scope="row">
//                                 {subject.subjectCode}
//                             </TableCell>
//                             <TableCell>{subject.name}</TableCell>
//                             <TableCell>{new Date(subject.createdAt).toLocaleDateString()}</TableCell>
//                             {/* Add Actions Cell later (Edit/Delete buttons) */}
//                         </TableRow>
//                     ))
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </Paper>
//       )}
//     </Container>
//   );
// };

// export default SubjectListPage;

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { getAllSubjects } from "../../api/subjectApi"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const SubjectListPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllSubjects();
        setSubjects(response.data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load subjects."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleSubjectChange = (event) => {
    setSelectedSubjectId(event.target.value);
  };

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);

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
          Manage Subjects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/subjects/create"
        >
          Add Subject
        </Button>
      </Box>

      {loading && <LoadingSpinner />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Paper elevation={3} sx={{ p: 3 }}>
          {" "}
          {/* Added padding to Paper */}
          {subjects.length === 0 ? (
            <Typography variant="subtitle1" align="center">
              No subjects found. You can add a new subject using the button
              above.
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="subject-select-label">
                Select a Subject
              </InputLabel>
              <Select
                labelId="subject-select-label"
                id="subject-select"
                value={selectedSubjectId}
                label="Select a Subject" // Important for outlined variant label behavior
                onChange={handleSubjectChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.subjectCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {selectedSubject && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              {" "}
              {/* Using outlined Paper for details */}
              <Typography variant="h6" component="h2" gutterBottom>
                Subject Details
              </Typography>
              <Typography>
                <strong>Subject Code:</strong> {selectedSubject.subjectCode}
              </Typography>
              <Typography>
                <strong>Subject Name:</strong> {selectedSubject.name}
              </Typography>
              <Typography>
                <strong>Created At:</strong>{" "}
                {new Date(selectedSubject.createdAt).toLocaleDateString()}
              </Typography>
              {/* You could add Edit/Delete buttons here for the selected subject */}
              {/* e.g., <Button component={RouterLink} to={`/subjects/edit/${selectedSubject._id}`}>Edit</Button> */}
            </Paper>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default SubjectListPage;
