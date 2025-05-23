
// src/pages/Timetables/TimetableUpsertPage.js
import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  IconButton,
  Autocomplete,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { upsertTimetable } from "../../api/timetableApi";
import { getAllSubjects } from "../../api/subjectApi";
import { getAllLocations } from "../../api/locationApi";
import { getUsers } from "../../api/userApi";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TimetableUpsertPage = () => {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("A");
  const [term, setTerm] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    const initialSchedule = {};
    daysOfWeek.forEach((day) => {
      initialSchedule[day] = [];
    });
    return initialSchedule;
  });

  const [subjects, setSubjects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [professors, setProfessors] = useState([]);

  const [loading, setLoading] = useState(false); // Main form loading
  const [dataLoading, setDataLoading] = useState(true); // For initial dropdown data
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      setError(null);
      try {
        const [subjectsRes, locationsRes, professorsRes] = await Promise.all([
          getAllSubjects(),
          getAllLocations(),
          getUsers({ role: "professor" }),
        ]);
        setSubjects(subjectsRes.data || []);
        setLocations(locationsRes.data || []);
        setProfessors(professorsRes.data.data || []);
        console.log("Fetched Professors (Actual):", professorsRes.data.data);
      } catch (err) {
        console.error("Failed to fetch data for timetable form:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load required data.";
        setError(
          `Error loading dropdown data: ${errMsg}. Some selection might be unavailable.`
        );
        setSubjects([]);
        setLocations([]);
        setProfessors([]);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const addSlot = (day) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: [
        ...prev[day],
        {
          startTime: "",
          endTime: "",
          subject: "",
          professor: "",
          location: "",
        },
      ],
    }));
  };

  const removeSlot = (day, index) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleSlotChange = (day, index, field, value) => {
    setWeeklySchedule((prev) => {
      const updatedDaySchedule = [...prev[day]];
      updatedDaySchedule[index] = {
        ...updatedDaySchedule[index],
        [field]: value,
      };
      return { ...prev, [day]: updatedDaySchedule };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!branch || !semester || !section || !term) {
      setError("Branch, Semester, Section, and Term are required.");
      setLoading(false);
      return;
    }

    let scheduleValid = true;
    let firstInvalidSlotInfo = null;

    for (const day of daysOfWeek) {
      if (weeklySchedule[day] && weeklySchedule[day].length > 0) {
        // Only validate if day has slots
        for (let i = 0; i < weeklySchedule[day].length; i++) {
          const slot = weeklySchedule[day][i];
          if (
            !slot.startTime ||
            !slot.endTime ||
            !slot.subject ||
            !slot.professor ||
            !slot.location
          ) {
            scheduleValid = false;
            firstInvalidSlotInfo = { day, index: i, startTime: slot.startTime };
            break;
          }
        }
      }
      if (!scheduleValid) break;
    }

    if (!scheduleValid) {
      let detail = "Please fill all fields for every time slot.";
      if (firstInvalidSlotInfo) {
        // Make day and index more user-friendly
        const userFriendlyDay = firstInvalidSlotInfo.day;
        const userFriendlyIndex = firstInvalidSlotInfo.index + 1; // 1-based index
        const slotIdentifier = firstInvalidSlotInfo.startTime
          ? `the slot starting at ${firstInvalidSlotInfo.startTime} (slot #${userFriendlyIndex}) on ${userFriendlyDay}`
          : `slot #${userFriendlyIndex} on ${userFriendlyDay}`;
        detail = `Please fill all fields for ${slotIdentifier}.`;
      }
      setError(
        `Validation Error: ${detail} Required fields are Start Time, End Time, Subject, Professor, and Location.`
      );
      setLoading(false);
      return;
    }

    const timetableData = {
      branch,
      semester: parseInt(semester, 10),
      section: section.toUpperCase(),
      term: term.toUpperCase(),
      weeklySchedule,
    };

    try {
      await upsertTimetable(timetableData);
      setSuccessOpen(true);
      setTimeout(() => {
        navigate("/timetables");
      }, 1500);
    } catch (err) {
      console.error("Failed to upsert timetable:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save timetable."
      );
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSuccessOpen(false);

  const currentDay = daysOfWeek[currentTab];

  return (
    <Container maxWidth="lg">
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
          to="/timetables"
        >
          Timetables
        </Link>
        <Typography color="text.primary">Create/Update Timetable</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create / Update Timetable
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Branch (e.g., CSE)"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                fullWidth
                disabled={loading || dataLoading}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Semester (1-8)"
                type="number"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
                fullWidth
                disabled={loading || dataLoading}
                inputProps={{ min: 1, max: 8 }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Section (e.g., A)"
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                required
                fullWidth
                disabled={loading || dataLoading}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Term (e.g., FALL 2024)"
                value={term}
                onChange={(e) => setTerm(e.target.value.toUpperCase())}
                required
                fullWidth
                disabled={loading || dataLoading}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Weekly Schedule
          </Typography>
          {dataLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>
                Loading schedule options...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  aria-label="weekly schedule tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {daysOfWeek.map((day, index) => (
                    <Tab
                      label={day}
                      key={day}
                      id={`tab-${index}`}
                      aria-controls={`tabpanel-${index}`}
                      disabled={loading}
                    />
                  ))}
                </Tabs>
              </Box>

              <Box
                role="tabpanel"
                hidden={false}
                id={`tabpanel-${currentTab}`}
                aria-labelledby={`tab-${currentTab}`}
              >
                {weeklySchedule[currentDay]?.map((slot, index) => (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, mb: 2 }}
                    key={`${currentDay}-${index}`}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6} sm={2}>
                        <TextField
                          label="Start Time"
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleSlotChange(
                              currentDay,
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          required
                          fullWidth
                          size="small"
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <TextField
                          label="End Time"
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleSlotChange(
                              currentDay,
                              index,
                              "endTime",
                              e.target.value
                            )
                          }
                          InputLabelProps={{ shrink: true }}
                          required
                          fullWidth
                          size="small"
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Autocomplete
                          options={subjects}
                          getOptionLabel={(option) =>
                            `${option.subjectCode} - ${option.name}`
                          }
                          value={
                            subjects.find((s) => s._id === slot.subject) || null
                          }
                          onChange={(_, newValue) =>
                            handleSlotChange(
                              currentDay,
                              index,
                              "subject",
                              newValue?._id || ""
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Subject"
                              required
                              size="small"
                            />
                          )}
                          isOptionEqualToValue={(option, value) =>
                            option._id === value?._id
                          }
                          disabled={loading || subjects.length === 0}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Autocomplete
                          options={professors}
                          getOptionLabel={(option) =>
                            `${option.firstName} ${option.lastName} (${
                              option.facultyId || option.email || "N/A"
                            })`
                          }
                          value={
                            professors.find((p) => p._id === slot.professor) ||
                            null
                          }
                          onChange={(_, newValue) =>
                            handleSlotChange(
                              currentDay,
                              index,
                              "professor",
                              newValue?._id || ""
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Professor"
                              required
                              size="small"
                            />
                          )}
                          isOptionEqualToValue={(option, value) =>
                            option._id === value?._id
                          }
                          disabled={loading || professors.length === 0}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Autocomplete
                          options={locations}
                          getOptionLabel={(option) =>
                            `${option.name} ${
                              option.building ? `(${option.building})` : ""
                            }`
                          }
                          value={
                            locations.find((l) => l._id === slot.location) ||
                            null
                          }
                          onChange={(_, newValue) =>
                            handleSlotChange(
                              currentDay,
                              index,
                              "location",
                              newValue?._id || ""
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Location"
                              required
                              size="small"
                            />
                          )}
                          isOptionEqualToValue={(option, value) =>
                            option._id === value?._id
                          }
                          disabled={loading || locations.length === 0}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} sx={{ textAlign: "right" }}>
                        <IconButton
                          onClick={() => removeSlot(currentDay, index)}
                          color="error"
                          size="small"
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => addSlot(currentDay)}
                  size="small"
                  sx={{ mt: 1 }}
                  disabled={loading}
                >
                  Add Time Slot for {currentDay}
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ mt: 4, position: "relative" }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || dataLoading}
            >
              {loading ? <CircularProgress size={24} /> : "Save Timetable"}
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
          Timetable saved successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TimetableUpsertPage;
