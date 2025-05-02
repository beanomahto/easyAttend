import React from 'react';
import { Alert } from '@mui/material';

const AlertMessage = ({ severity = 'error', message }) => {
  if (!message) return null;
  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
};

export default AlertMessage;