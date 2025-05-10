import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SubjectIcon from "@mui/icons-material/Book"; // Changed to Book for Subjects
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount"; // For Professors
import PeopleIcon from "@mui/icons-material/People"; // For Students
// Import other icons as needed

const drawerWidth = 240;

const Sidebar = () => {
  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Subjects", icon: <SubjectIcon />, path: "/subjects" },
    { text: "Locations", icon: <LocationOnIcon />, path: "/locations" },
    { text: "Timetables", icon: <ScheduleIcon />, path: "/timetables" },
    {
      text: "Professors",
      icon: <SupervisorAccountIcon />,
      path: "/professors",
    },
    { text: "Students", icon: <PeopleIcon />, path: "/students" }, // <-- ADDED STUDENTS LINK
    // Add User Management link later if needed
  ];

  const drawer = (
    <div>
      <Toolbar
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {/* You can put a logo or App name here */}
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterNavLink}
              to={item.path}
              // Style active link using NavLink's ability to receive a function
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? "rgba(0, 0, 0, 0.08)" // MUI's default selection color hint
                  : "transparent",
                color: isActive ? "primary.main" : "inherit", // Optionally change text color
              })}
              sx={{
                "&.active .MuiListItemIcon-root": {
                  // Target icon when active
                  color: "primary.main",
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
