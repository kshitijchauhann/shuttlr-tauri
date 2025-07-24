import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
// Removed HomeIcon import
import Box from '@mui/material/Box';

const Layout = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        {/* Simplified Link for Dashboard */}
        <Link
          to="/home" 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            color: 'black', 
            textDecoration: 'none',
            fontWeight: 'bold' 
          }} 
        >
          {/* Removed HomeIcon */}
          Shuttlr
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          const displayName = value
            .replace(/-/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return last ? (
            <Typography key={to} color="text.primary" sx={{ fontWeight: 'bold' }}> {/* Made current item bold */}
              {displayName}
            </Typography>
          ) : (
            <Link
              // Removed underline="hover"
              to={to}
              key={to}
              style={{ textDecoration: 'none' }} // Ensure no default underline for intermediate links
            >
              {displayName}
            </Link>
          );
        })}
      </Breadcrumbs>
      <Outlet /> {/* This is where your nested routes will render */}
    </Box>
  );
};

export default Layout;
