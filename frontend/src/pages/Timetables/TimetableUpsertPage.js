import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Typography, Box, TextField, Button, CircularProgress,
    Snackbar, Alert, Paper, Breadcrumbs, Link, Grid,
     Tabs, Tab, IconButton, Autocomplete
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { upsertTimetable } from '../../api/timetableApi';
import { getAllSubjects } from '../../api/subjectApi';
import { getAllLocations } from '../../api/locationApi';
// At the top of src/pages/Timetables/TimetableUpsertPage.js
import { getUsers } from '../../api/userApi'; // <<<--- ADD THIS IMPORT
// --- IMPORTANT: Need API to fetch professors (Users with role=professor) ---
// import { getProfessors } from '../../api/userApi'; // Assuming this exists

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- Placeholder - Replace with actual API call ---
// const getProfessors = async () => {
//     console.warn("API call to fetch professors not implemented. Returning placeholder data.");
//     // In a real app, fetch users with role 'professor' from backend
//     // Example: return await axiosInstance.get('/users?role=professor');
//     return { data: [
//         { _id: "prof_id_1", firstName: "Albus", lastName: "Dumbledore" },
//         { _id: "prof_id_2", firstName: "Minerva", lastName: "McGonagall" }
//     ] };
// }
// --- End Placeholder ---


const TimetableUpsertPage = () => {
    // State for form fields
    const [branch, setBranch] = useState('');
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('A');
    const [term, setTerm] = useState(''); // e.g., "FALL 2024"
    const [weeklySchedule, setWeeklySchedule] = useState(() => {
        // Initialize schedule object with empty arrays for each day
        const initialSchedule = {};
        daysOfWeek.forEach(day => { initialSchedule[day] = []; });
        return initialSchedule;
    });

    // State for dropdown data
    const [subjects, setSubjects] = useState([]);
    const [locations, setLocations] = useState([]);
    const [professors, setProfessors] = useState([]); // Requires backend endpoint

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0); // Index of the current day tab

    const navigate = useNavigate();

    // Fetch data for dropdowns on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); // Clear previous errors on reload
            try {
                const [subjectsRes, locationsRes, professorsRes] = await Promise.all([
                    getAllSubjects(),
                    getAllLocations(),
                    getUsers({ role: 'professor' }) // Fetch professors - Requires API
                ]);
                setSubjects(subjectsRes.data || []);
                setLocations(locationsRes.data || []);
                setProfessors(professorsRes.data || []);  // Use the fetched data
                //  console.log("Fetched Professors:", professorsRes.data);
                console.log("Fetched Professors (Actual):", professorsRes.data); // Log actual data
            } catch (err) {
                console.error("Failed to fetch data for timetable form:", err);
                setError("Failed to load subjects, locations, or professors.");
                // Provide more specific error if possible
                const errMsg = err.response?.data?.message || err.message || "Failed to load required data.";
                setError(`Error loading dropdown data: ${errMsg}`);
                // Clear dropdowns on error?
                setSubjects([]);
                setLocations([]);
                setProfessors([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Handlers for Weekly Schedule ---
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const addSlot = (day) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: [...prev[day], { startTime: '', endTime: '', subject: '', professor: '', location: '' }]
        }));
    };

    const removeSlot = (day, index) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== index)
        }));
    };

    const handleSlotChange = (day, index, field, value) => {
        setWeeklySchedule(prev => {
            const updatedDaySchedule = [...prev[day]];
            updatedDaySchedule[index] = { ...updatedDaySchedule[index], [field]: value };
            return { ...prev, [day]: updatedDaySchedule };
        });
    };

    // --- Form Submission ---
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!branch || !semester || !section || !term) {
            setError("Branch, Semester, Section, and Term are required.");
            setLoading(false);
            return;
        }

        // Add validation for schedule slots (e.g., ensure all fields are filled)
        // ... validation logic ...

        const timetableData = { branch, semester, section, term, weeklySchedule };

        try {
            await upsertTimetable(timetableData);
            setSuccessOpen(true);
            setTimeout(() => {
                // TODO: Navigate back to a timetable list page when created
                navigate('/dashboard'); // Go to dashboard for now
            }, 1500);
        } catch (err) {
            console.error("Failed to upsert timetable:", err);
            setError(err.response?.data?.message || err.message || "Failed to save timetable.");
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => setSuccessOpen(false);

    const currentDay = daysOfWeek[currentTab];

    return (
        <Container maxWidth="lg">
             {/* Breadcrumbs */}
             <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">Dashboard</Link>
                {/* Add link to Timetable List if it exists */}
                <Typography color="text.primary">Create/Update Timetable</Typography>
            </Breadcrumbs>

             <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Create / Update Timetable
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={3}><TextField label="Branch (e.g., CSE)" value={branch} onChange={(e) => setBranch(e.target.value)} required fullWidth disabled={loading} /></Grid>
                        <Grid item xs={12} sm={3}><TextField label="Semester (1-8)" type="number" value={semester} onChange={(e) => setSemester(e.target.value)} required fullWidth disabled={loading} inputProps={{ min: 1, max: 8 }} /></Grid>
                        <Grid item xs={12} sm={3}><TextField label="Section (e.g., A)" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} required fullWidth disabled={loading} /></Grid>
                        <Grid item xs={12} sm={3}><TextField label="Term (e.g., FALL 2024)" value={term} onChange={(e) => setTerm(e.target.value.toUpperCase())} required fullWidth disabled={loading} /></Grid>
                    </Grid>

                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Weekly Schedule</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={currentTab} onChange={handleTabChange} aria-label="weekly schedule tabs" variant="scrollable" scrollButtons="auto">
                            {daysOfWeek.map((day, index) => (
                                <Tab label={day} key={day} id={`tab-${index}`} aria-controls={`tabpanel-${index}`} />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Render slots for the currently selected day */}
                    <Box role="tabpanel" hidden={false} id={`tabpanel-${currentTab}`} aria-labelledby={`tab-${currentTab}`}>
                         {weeklySchedule[currentDay]?.map((slot, index) => (
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }} key={`${currentDay}-${index}`}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={6} sm={2}><TextField label="Start Time" type="time" value={slot.startTime} onChange={(e) => handleSlotChange(currentDay, index, 'startTime', e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth size="small" /></Grid>
                                    <Grid item xs={6} sm={2}><TextField label="End Time" type="time" value={slot.endTime} onChange={(e) => handleSlotChange(currentDay, index, 'endTime', e.target.value)} InputLabelProps={{ shrink: true }} required fullWidth size="small" /></Grid>
                                    <Grid item xs={12} sm={2}>
                                         <Autocomplete
                                            options={subjects}
                                            getOptionLabel={(option) => `${option.subjectCode} - ${option.name}`}
                                            value={subjects.find(s => s._id === slot.subject) || null}
                                            onChange={(_, newValue) => handleSlotChange(currentDay, index, 'subject', newValue?._id || '')}
                                            renderInput={(params) => <TextField {...params} label="Subject" required size="small" />}
                                            isOptionEqualToValue={(option, value) => option._id === value?._id}
                                        />
                                    </Grid>
                                     <Grid item xs={12} sm={3}>
                                         {/* --- Professor Dropdown (using Autocomplete) --- */}
                                        <Autocomplete
                                            options={professors}
                                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email || 'No email'})`}
                                            value={professors.find(p => p._id === slot.professor) || null}
                                            onChange={(_, newValue) => handleSlotChange(currentDay, index, 'professor', newValue?._id || '')}
                                            renderInput={(params) => <TextField {...params} label="Professor" required size="small" />}
                                            isOptionEqualToValue={(option, value) => option._id === value?._id}
                                            disabled={professors.length === 0} // Disable if no professors loaded
                                        />
                                     </Grid>
                                      <Grid item xs={12} sm={2}>
                                         <Autocomplete
                                            options={locations}
                                            getOptionLabel={(option) => option.name}
                                            value={locations.find(l => l._id === slot.location) || null}
                                            onChange={(_, newValue) => handleSlotChange(currentDay, index, 'location', newValue?._id || '')}
                                            renderInput={(params) => <TextField {...params} label="Location" required size="small" />}
                                             isOptionEqualToValue={(option, value) => option._id === value?._id}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                                        <IconButton onClick={() => removeSlot(currentDay, index)} color="error" size="small">
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
                        >
                            Add Time Slot for {currentDay}
                        </Button>
                    </Box>

                     {/* Submission Button */}
                     <Box sx={{ mt: 4, position: 'relative' }}>
                        <Button type="submit" fullWidth variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Save Timetable'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
             <Snackbar open={successOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>Timetable saved successfully! Redirecting...</Alert>
            </Snackbar>
        </Container>
    );
};

export default TimetableUpsertPage;