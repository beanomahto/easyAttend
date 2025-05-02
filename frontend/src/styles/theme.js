import { createTheme } from '@mui/material/styles';

// Example basic theme
const theme = createTheme({
  palette: {
    // mode: 'light', // or 'dark'
    primary: {
      main: '#1976d2', // Example primary color (Material UI Blue)
    },
    secondary: {
      main: '#dc004e', // Example secondary color (Material UI Pink)
    },
    // background: {
    //   default: '#f4f6f8', // Example light grey background
    //   paper: '#ffffff',
    // },
  },
  typography: {
    // Customize typography if needed
    // h1: { ... }
  },
  components: {
    // Example: Override default AppBar elevation
    MuiAppBar: {
      styleOverrides: {
        root: {
          elevation: 1, // Less shadow
        },
      },
    },
    // Add other component overrides
  },
});

export default theme;