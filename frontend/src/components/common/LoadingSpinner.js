import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = ({ size = 40 }) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ my: 4 }}>
      <CircularProgress size={size} />
    </Box>
  );
};

export default LoadingSpinner;