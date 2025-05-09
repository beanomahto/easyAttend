// 



// src/pages/admin/DashboardPage.js
import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, Paper, Box, List, ListItem, ListItemText, CircularProgress, Alert } from "@mui/material";
import PeopleIcon from '@mui/icons-material/People'; // Example Icon
import SchoolIcon from '@mui/icons-material/School'; // Example Icon
import BookIcon from '@mui/icons-material/Book'; // Example Icon
import LocationOnIcon from '@mui/icons-material/LocationOn'; // Example Icon

import { getDashboardStats } from "../../api/dashboardApi"; // Adjust path
import { io } from "socket.io-client"; // Import socket.io client

// Define your backend URL (ensure this is correct for your setup)
const BACKEND_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"; // Or your specific backend URL

const StatCard = ({ title, value, icon }) => (
    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
        {icon && React.cloneElement(icon, { sx: { fontSize: 40, mb: 1, color: 'primary.main' } })}
        <Typography variant="h6" component="div" sx={{ color: 'text.secondary' }}>
            {title}
        </Typography>
        <Typography variant="h3" component="div">
            {value}
        </Typography>
    </Paper>
);


const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: "--",
    totalProfessors: "--",
    totalSubjects: "--",
    totalLocations: "--",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardStats();
        setStats({
          totalStudents: response.data.totalStudents,
          totalProfessors: response.data.totalProfessors,
          totalSubjects: response.data.totalSubjects,
          totalLocations: response.data.totalLocations,
        });
        setRecentActivity(response.data.recentActivity || []);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError(
          "Failed to load dashboard data. " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // --- WebSocket Connection ---
    // Ensure your backend URL is correct. If your API is at /api, socket connects to the root.
    const socket = io(BACKEND_URL, {
        // Add withCredentials if you use httpOnly cookies for auth & need to pass them
        // withCredentials: true,
        // You might need to pass a token if your socket connections are authenticated
        // auth: { token: localStorage.getItem('adminToken') } // Example
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket server for dashboard updates.");
    });

    // Listen for general dashboard updates (like new activity messages)
    socket.on("dashboardUpdate", (data) => {
      console.log("Received dashboardUpdate event:", data);
      setRecentActivity(prevActivity => [
          { message: data.message, time: data.time || new Date().toISOString() },
          ...prevActivity
        ].slice(0, 10) // Keep last 10 activities
      );
      // Optionally, you could trigger a full refetch or update specific counts based on data.type
      // For example, if data.type is 'NEW_STUDENT', increment student count.
      // But it's often easier if backend sends full new counts (see 'statsCountUpdate')
    });

    // Listen for specific count updates
    socket.on("statsCountUpdate", (data) => {
        console.log("Received statsCountUpdate event:", data); // { entity: 'students', count: 15 }
        if (data && data.entity) {
            setStats(prevStats => ({
                ...prevStats,
                [`total${data.entity.charAt(0).toUpperCase() + data.entity.slice(1)}`]: data.count
            }));
        }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server.");
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket Connection Error:", err.message);
      // setError(prevError => prevError ? prevError + " WebSocket connection failed." : "WebSocket connection failed.");
    });

    // Cleanup on component unmount
    return () => {
      socket.off("dashboardUpdate");
      socket.off("statsCountUpdate");
      socket.disconnect();
      console.log("Dashboard WebSocket disconnected and listeners removed.");
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography>Loading Dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={stats.totalStudents} icon={<PeopleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Professors" value={stats.totalProfessors} icon={<SchoolIcon />}/>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Subjects" value={stats.totalSubjects} icon={<BookIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Locations" value={stats.totalLocations} icon={<LocationOnIcon />} />
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            {recentActivity.length > 0 ? (
              <List dense>
                {recentActivity.map((activity, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemText
                      primary={activity.message}
                      secondary={new Date(activity.time).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No recent activity to display.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;