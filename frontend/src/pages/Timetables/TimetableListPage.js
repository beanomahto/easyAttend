// // src/pages/timetable/TimetableListPage.js
// import React, { useState, useEffect, useMemo } from "react";
// import { Link as RouterLink, useNavigate } from "react-router-dom";
// import {
//   Container,
//   Typography,
//   Button,
//   Box,
//   Paper,
//   Alert,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Grid,
//   Card,
//   CardContent,
//   CardActions,
//   Chip,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import EditIcon from '@mui/icons-material/Edit';
// import VisibilityIcon from '@mui/icons-material/Visibility'; // Optional
// import { getTimetables } from "../../api/timetableApi"; // Adjust path
// import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

// const TimetableListPage = () => {
//   const navigate = useNavigate();
//   const [allTimetables, setAllTimetables] = useState([]);

//   // Filters
//   const [selectedTerm, setSelectedTerm] = useState("");
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [selectedSemester, setSelectedSemester] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");

//   // Derived dropdown options
//   const [availableTerms, setAvailableTerms] = useState([]);
//   const [availableBranches, setAvailableBranches] = useState([]);
//   const [availableSemesters, setAvailableSemesters] = useState([]);
//   const [availableSections, setAvailableSections] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch all active timetables on mount
//   useEffect(() => {
//     const fetchAllActiveTimetables = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await getTimetables({ isActive: true }); // Fetch only active ones
//         setAllTimetables(response.data || []);
//       } catch (err) {
//         console.error("Failed to fetch timetables:", err);
//         setError(
//           err.response?.data?.message ||
//             err.message ||
//             "Failed to load timetables."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllActiveTimetables();
//   }, []);

//   // Effect to update available terms from allTimetables
//   useEffect(() => {
//     if (allTimetables.length > 0) {
//       const terms = [...new Set(allTimetables.map((tt) => tt.term))].sort(
//         (a, b) => b.localeCompare(a) // Sort descending (latest term first)
//       );
//       setAvailableTerms(terms);
//       if (terms.length > 0 && !selectedTerm) {
//         // setSelectedTerm(terms[0]); // Optionally pre-select the latest term
//       }
//     } else {
//       setAvailableTerms([]);
//     }
//   }, [allTimetables, selectedTerm]);

//   // Effect to update available branches when term changes
//   useEffect(() => {
//     if (selectedTerm) {
//       const branches = [
//         ...new Set(
//           allTimetables
//             .filter((tt) => tt.term === selectedTerm)
//             .map((tt) => tt.branch)
//         ),
//       ].sort();
//       setAvailableBranches(branches);
//     } else {
//       setAvailableBranches([]);
//     }
//     setSelectedBranch(""); // Reset subsequent filters
//     setSelectedSemester("");
//     setSelectedSection("");
//   }, [selectedTerm, allTimetables]);

//   // Effect to update available semesters when branch changes
//   useEffect(() => {
//     if (selectedBranch && selectedTerm) {
//       const semesters = [
//         ...new Set(
//           allTimetables
//             .filter(
//               (tt) => tt.term === selectedTerm && tt.branch === selectedBranch
//             )
//             .map((tt) => tt.semester)
//         ),
//       ].sort((a, b) => a - b);
//       setAvailableSemesters(semesters);
//     } else {
//       setAvailableSemesters([]);
//     }
//     setSelectedSemester(""); // Reset subsequent filters
//     setSelectedSection("");
//   }, [selectedBranch, selectedTerm, allTimetables]);

//   // Effect to update available sections when semester changes
//   useEffect(() => {
//     if (selectedSemester && selectedBranch && selectedTerm) {
//       const sections = [
//         ...new Set(
//           allTimetables
//             .filter(
//               (tt) =>
//                 tt.term === selectedTerm &&
//                 tt.branch === selectedBranch &&
//                 tt.semester === parseInt(selectedSemester)
//             )
//             .map((tt) => tt.section)
//         ),
//       ].sort();
//       setAvailableSections(sections);
//     } else {
//       setAvailableSections([]);
//     }
//     setSelectedSection(""); // Reset subsequent filter
//   }, [selectedSemester, selectedBranch, selectedTerm, allTimetables]);

//   // Memoized selected timetable details
//   const selectedTimetableDetails = useMemo(() => {
//     if (
//       selectedTerm &&
//       selectedBranch &&
//       selectedSemester &&
//       selectedSection
//     ) {
//       return allTimetables.find(
//         (tt) =>
//           tt.term === selectedTerm &&
//           tt.branch === selectedBranch &&
//           tt.semester === parseInt(selectedSemester) &&
//           tt.section === selectedSection
//       );
//     }
//     return null;
//   }, [
//     allTimetables,
//     selectedTerm,
//     selectedBranch,
//     selectedSemester,
//     selectedSection,
//   ]);

//   const handleEdit = (timetable) => {
//     // Navigate to an edit page, passing identifiers for the upsert operation
//     // The upsert uses term, branch, semester, section as its filter.
//     navigate(
//       `/timetables/edit?term=${encodeURIComponent(timetable.term)}&branch=${encodeURIComponent(timetable.branch)}&semester=${timetable.semester}§ion=${encodeURIComponent(timetable.section)}`
//     );
//   };

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
//           Manage Timetables
//         </Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           component={RouterLink}
//           to="/timetables/create" // This route should lead to your TimetableForm component
//         >
//           Add Timetable
//         </Button>
//       </Box>

//       {loading && <LoadingSpinner />}
//       {error && (
//         <Alert severity="error" sx={{ mb: 2 }}>
//           {error}
//         </Alert>
//       )}

//       {!loading && !error && (
//         <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
//           {allTimetables.length === 0 ? (
//             <Typography variant="subtitle1" align="center">
//               No active timetables found. You can add a new timetable using the
//               button above.
//             </Typography>
//           ) : (
//             <Grid container spacing={2} alignItems="flex-start">
//               {/* Term Dropdown */}
//               <Grid item xs={12} sm={6} md={3}>
//                 <FormControl fullWidth>
//                   <InputLabel id="term-select-label">Select Term</InputLabel>
//                   <Select
//                     labelId="term-select-label"
//                     value={selectedTerm}
//                     label="Select Term"
//                     onChange={(e) => setSelectedTerm(e.target.value)}
//                   >
//                     <MenuItem value=""><em>None</em></MenuItem>
//                     {availableTerms.map((term) => (
//                       <MenuItem key={term} value={term}>{term}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>

//               {/* Branch Dropdown */}
//               <Grid item xs={12} sm={6} md={3}>
//                 <FormControl fullWidth disabled={!selectedTerm || availableBranches.length === 0}>
//                   <InputLabel id="branch-select-label">Select Branch</InputLabel>
//                   <Select
//                     labelId="branch-select-label"
//                     value={selectedBranch}
//                     label="Select Branch"
//                     onChange={(e) => setSelectedBranch(e.target.value)}
//                   >
//                     <MenuItem value=""><em>None</em></MenuItem>
//                     {availableBranches.map((branch) => (
//                       <MenuItem key={branch} value={branch}>{branch}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>

//               {/* Semester Dropdown */}
//               <Grid item xs={12} sm={6} md={3}>
//                 <FormControl fullWidth disabled={!selectedBranch || availableSemesters.length === 0}>
//                   <InputLabel id="semester-select-label">Select Semester</InputLabel>
//                   <Select
//                     labelId="semester-select-label"
//                     value={selectedSemester}
//                     label="Select Semester"
//                     onChange={(e) => setSelectedSemester(e.target.value)}
//                   >
//                      <MenuItem value=""><em>None</em></MenuItem>
//                     {availableSemesters.map((sem) => (
//                       <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>

//               {/* Section Dropdown */}
//               <Grid item xs={12} sm={6} md={3}>
//                 <FormControl fullWidth disabled={!selectedSemester || availableSections.length === 0}>
//                   <InputLabel id="section-select-label">Select Section</InputLabel>
//                   <Select
//                     labelId="section-select-label"
//                     value={selectedSection}
//                     label="Select Section"
//                     onChange={(e) => setSelectedSection(e.target.value)}
//                   >
//                     <MenuItem value=""><em>None</em></MenuItem>
//                     {availableSections.map((sec) => (
//                       <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//             </Grid>
//           )}
//         </Paper>
//       )}

//       {selectedTimetableDetails ? (
//         <Card variant="outlined" sx={{ mt: 2 }}>
//           <CardContent>
//             <Typography variant="h6" component="div" gutterBottom>
//               Timetable Details
//             </Typography>
//             <Typography variant="body1">
//               <strong>Term:</strong> {selectedTimetableDetails.term}
//             </Typography>
//             <Typography variant="body1">
//               <strong>Branch:</strong> {selectedTimetableDetails.branch}
//             </Typography>
//             <Typography variant="body1">
//               <strong>Semester:</strong> {selectedTimetableDetails.semester}
//             </Typography>
//             <Typography variant="body1">
//               <strong>Section:</strong> {selectedTimetableDetails.section}
//             </Typography>
//             <Typography variant="body1" sx={{ mt: 1 }}>
//               <strong>Status:</strong>{" "}
//               <Chip
//                 label={selectedTimetableDetails.isActive ? "Active" : "Inactive"}
//                 color={selectedTimetableDetails.isActive ? "success" : "default"}
//                 size="small"
//               />
//             </Typography>
//              <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
//                 Created: {new Date(selectedTimetableDetails.createdAt).toLocaleString()}
//             </Typography>
//              <Typography variant="body2" color="text.secondary">
//                 Last Updated: {new Date(selectedTimetableDetails.updatedAt).toLocaleString()}
//             </Typography>
//             {/* Displaying full weeklySchedule here can be complex.
//                 Consider a button to view/edit the full schedule. */}
//           </CardContent>
//           <CardActions>
//             <Button
//               size="small"
//               startIcon={<EditIcon />}
//               onClick={() => handleEdit(selectedTimetableDetails)}
//             >
//               Edit Schedule
//             </Button>
//             {/* Optional: Button to view full schedule details if too complex for this page */}
//             {/* <Button size="small" startIcon={<VisibilityIcon />}>View Full Schedule</Button> */}
//           </CardActions>
//         </Card>
//       ) : (
//         !loading && !error && allTimetables.length > 0 && (
//           <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
//             Please select Term, Branch, Semester, and Section to view timetable details.
//           </Typography>
//         )
//       )}
//     </Container>
//   );
// };

// export default TimetableListPage;

// src/pages/timetable/TimetableListPage.js
import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
  Card,
  CardContent,
  CardActions,
  Chip,
  TableContainer, // For schedule display
  Table, // For schedule display
  TableHead, // For schedule display
  TableBody, // For schedule display
  TableRow, // For schedule display
  TableCell, // For schedule display
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
// import VisibilityIcon from '@mui/icons-material/Visibility'; // Optional
import { getTimetables } from "../../api/timetableApi"; // Adjust path
import LoadingSpinner from "../../components/common/LoadingSpinner"; // Adjust path

const daysOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TimetableListPage = () => {
  const navigate = useNavigate();
  const [allTimetables, setAllTimetables] = useState([]);

  // Filters
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // Derived dropdown options
  const [availableTerms, setAvailableTerms] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all active timetables on mount
  useEffect(() => {
    const fetchAllActiveTimetables = async () => {
      setLoading(true);
      setError(null);
      try {
        // To display schedule, ensure backend populates deeply enough:
        const response = await getTimetables({
          isActive: true,
          // Add a query param if backend supports deeper population for this view
          // populate: 'deep' // Example, backend needs to handle this
        });
        setAllTimetables(response.data || []);
      } catch (err) {
        console.error("Failed to fetch timetables:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load timetables."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAllActiveTimetables();
  }, []);

  // Effect to update available terms from allTimetables
  useEffect(() => {
    if (allTimetables.length > 0) {
      const terms = [...new Set(allTimetables.map((tt) => tt.term))].sort(
        (a, b) => b.localeCompare(a)
      );
      setAvailableTerms(terms);
    } else {
      setAvailableTerms([]);
    }
  }, [allTimetables]);

  // Effect to update available branches when term changes
  useEffect(() => {
    if (selectedTerm) {
      const branches = [
        ...new Set(
          allTimetables
            .filter((tt) => tt.term === selectedTerm)
            .map((tt) => tt.branch)
        ),
      ].sort();
      setAvailableBranches(branches);
    } else {
      setAvailableBranches([]);
    }
    setSelectedBranch("");
    setSelectedSemester("");
    setSelectedSection("");
  }, [selectedTerm, allTimetables]);

  // Effect to update available semesters when branch changes
  useEffect(() => {
    if (selectedBranch && selectedTerm) {
      const semesters = [
        ...new Set(
          allTimetables
            .filter(
              (tt) => tt.term === selectedTerm && tt.branch === selectedBranch
            )
            .map((tt) => tt.semester)
        ),
      ].sort((a, b) => a - b);
      setAvailableSemesters(semesters);
    } else {
      setAvailableSemesters([]);
    }
    setSelectedSemester("");
    setSelectedSection("");
  }, [selectedBranch, selectedTerm, allTimetables]);

  // Effect to update available sections when semester changes
  useEffect(() => {
    if (selectedSemester && selectedBranch && selectedTerm) {
      const sections = [
        ...new Set(
          allTimetables
            .filter(
              (tt) =>
                tt.term === selectedTerm &&
                tt.branch === selectedBranch &&
                tt.semester === parseInt(selectedSemester)
            )
            .map((tt) => tt.section)
        ),
      ].sort();
      setAvailableSections(sections);
    } else {
      setAvailableSections([]);
    }
    setSelectedSection("");
  }, [selectedSemester, selectedBranch, selectedTerm, allTimetables]);

  // Memoized selected timetable details
  const selectedTimetableDetails = useMemo(() => {
    if (selectedTerm && selectedBranch && selectedSemester && selectedSection) {
      // Find the timetable
      const timetable = allTimetables.find(
        (tt) =>
          tt.term === selectedTerm &&
          tt.branch === selectedBranch &&
          tt.semester === parseInt(selectedSemester) &&
          tt.section === selectedSection
      );
      // IMPORTANT: Ensure weeklySchedule and its slots have populated data.
      // This might require your backend `getTimetables` to populate deeper.
      // If not populated, subject, professor, location will just be ObjectIds.
      return timetable;
    }
    return null;
  }, [
    allTimetables,
    selectedTerm,
    selectedBranch,
    selectedSemester,
    selectedSection,
  ]);

  const handleEdit = (timetable) => {
    navigate(
      `/timetables/edit?term=${encodeURIComponent(
        timetable.term
      )}&branch=${encodeURIComponent(timetable.branch)}&semester=${
        timetable.semester
      }§ion=${encodeURIComponent(timetable.section)}`
    );
  };

  // Helper to render a single time slot
  const renderTimeSlot = (slot) => (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        {slot.startTime} - {slot.endTime}
      </Typography>
      <Typography variant="body2">
        <strong>Subject:</strong>{" "}
        {slot.subject?.name ||
          slot.subject?.subjectCode ||
          slot.subject ||
          "N/A"}
      </Typography>
      <Typography variant="body2">
        <strong>Professor:</strong>{" "}
        {slot.professor?.firstName
          ? `${slot.professor.firstName} ${slot.professor.lastName}`
          : slot.professor || "N/A"}
      </Typography>
      <Typography variant="body2">
        <strong>Location:</strong>{" "}
        {slot.location?.name
          ? `${slot.location.name} (${slot.location.building || ""})`
          : slot.location || "N/A"}
      </Typography>
    </Paper>
  );

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
          Manage Timetables
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/timetables/create"
        >
          Add Timetable
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
          {allTimetables.length === 0 ? (
            <Typography variant="subtitle1" align="center">
              No active timetables found.
            </Typography>
          ) : (
            <Grid container spacing={2} alignItems="flex-start">
              {/* Term Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="term-select-label">Select Term</InputLabel>
                  <Select
                    labelId="term-select-label"
                    value={selectedTerm}
                    label="Select Term"
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {availableTerms.map((term) => (
                      <MenuItem key={term} value={term}>
                        {term}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Branch Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  disabled={!selectedTerm || availableBranches.length === 0}
                >
                  <InputLabel id="branch-select-label">
                    Select Branch
                  </InputLabel>
                  <Select
                    labelId="branch-select-label"
                    value={selectedBranch}
                    label="Select Branch"
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {availableBranches.map((branch) => (
                      <MenuItem key={branch} value={branch}>
                        {branch}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Semester Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  disabled={!selectedBranch || availableSemesters.length === 0}
                >
                  <InputLabel id="semester-select-label">
                    Select Semester
                  </InputLabel>
                  <Select
                    labelId="semester-select-label"
                    value={selectedSemester}
                    label="Select Semester"
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {availableSemesters.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Section Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  disabled={!selectedSemester || availableSections.length === 0}
                >
                  <InputLabel id="section-select-label">
                    Select Section
                  </InputLabel>
                  <Select
                    labelId="section-select-label"
                    value={selectedSection}
                    label="Select Section"
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {availableSections.map((sec) => (
                      <MenuItem key={sec} value={sec}>
                        Section {sec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {selectedTimetableDetails ? (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Timetable: {selectedTimetableDetails.branch} - Sem{" "}
              {selectedTimetableDetails.semester} - Sec{" "}
              {selectedTimetableDetails.section} (
              {selectedTimetableDetails.term})
              <Chip
                label={
                  selectedTimetableDetails.isActive ? "Active" : "Inactive"
                }
                color={
                  selectedTimetableDetails.isActive ? "success" : "default"
                }
                size="small"
              />
            </Typography>
            <Divider sx={{ my: 2 }} />

            {/* Weekly Schedule Display */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Weekly Schedule
            </Typography>
            {selectedTimetableDetails.weeklySchedule &&
            Object.keys(selectedTimetableDetails.weeklySchedule).length > 0 ? (
              <Grid container spacing={2}>
                {daysOrder.map((day) => {
                  const daySchedule =
                    selectedTimetableDetails.weeklySchedule[day];
                  if (daySchedule && daySchedule.length > 0) {
                    // Sort slots by start time for consistent display
                    const sortedDaySchedule = [...daySchedule].sort((a, b) =>
                      a.startTime.localeCompare(b.startTime)
                    );
                    return (
                      <Grid item xs={12} md={6} lg={4} key={day}>
                        {" "}
                        {/* Adjust grid sizing as needed */}
                        <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "1px solid #eee",
                              pb: 1,
                              mb: 1,
                            }}
                          >
                            {day}
                          </Typography>
                          {sortedDaySchedule.map((slot, index) => (
                            <Box
                              key={index}
                              mb={
                                index < sortedDaySchedule.length - 1 ? 1.5 : 0
                              }
                            >
                              {renderTimeSlot(slot)}
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    );
                  }
                  return null; // Or render an empty state for days with no classes
                })}
              </Grid>
            ) : (
              <Typography>
                No weekly schedule data available for this timetable.
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="body2" color="text.secondary">
              Created:{" "}
              {new Date(selectedTimetableDetails.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Updated:{" "}
              {new Date(selectedTimetableDetails.updatedAt).toLocaleString()}
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => handleEdit(selectedTimetableDetails)}
            >
              Edit Full Schedule
            </Button>
          </CardActions>
        </Card>
      ) : (
        !loading &&
        !error &&
        allTimetables.length > 0 && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
            Please select Term, Branch, Semester, and Section to view timetable
            details.
          </Typography>
        )
      )}
    </Container>
  );
};

export default TimetableListPage;
