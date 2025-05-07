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
import SubjectIcon from "@mui/icons-material/Subject";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
// Import other icons as needed

const drawerWidth = 240;

const Sidebar = () => {
  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Subjects", icon: <SubjectIcon />, path: "/subjects" },
    { text: "Locations", icon: <LocationOnIcon />, path: "/locations" },
    { text: "Timetables", icon: <ScheduleIcon />, path: "/timetables" },
    { text: "Professors", icon: <SubjectIcon />, path: "/professors" },
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
                  ? "rgba(0, 0, 0, 0.08)"
                  : "transparent",
              })}
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
