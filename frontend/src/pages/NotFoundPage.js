import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Oops! The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/dashboard">
        Go to Dashboard
      </Button>
    </Container>
  );
};

export default NotFoundPage;