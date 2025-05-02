import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';

const AdminLayout = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline /> {/* Normalize CSS */}
            <Header />
            <Sidebar />
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar /> {/* Necessary padding to offset the fixed AppBar */}
                <Outlet /> {/* Renders the matched child route's component */}
            </Box>
        </Box>
    );
};

export default AdminLayout;