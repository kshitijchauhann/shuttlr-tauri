import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { deepOrange } from '@mui/material/colors';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import LockOutlineIcon from '@mui/icons-material/LockOutline';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

import Logo from '../assets/double-black.svg';

const Profile = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file)); // Preview image
      console.log('Selected file:', file.name);
    }
  };

  return (
    <Box
      sx={{
        height: '90vh',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <img
        src={Logo}
        width="350px"
        style={{ marginBottom: '50px', marginTop: '20px' }}
        alt="Logo"
      />

      <Card
        sx={{
          boxShadow: 4,
          height: '200px',
          m: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            ml: 2,
            '& .MuiBadge-badge': {
              backgroundColor: '#fff',
              boxShadow: 2,
              borderRadius: '50%',
              height: 30,
              width: 30,
              p: 0,
            },
          }}
          badgeContent={
            <label htmlFor="upload-profile-pic">
              <input
                accept="image/*"
                id="upload-profile-pic"
                type="file"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <IconButton
                component="span"
                sx={{
                  p: 0,
                  m: 0,
                  height: 30,
                  width: 30,
                }}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </label>
          }
        >
          <Avatar
            src={selectedImage ?? undefined}
            sx={{
              height: 120,
              width: 120,
              bgcolor: deepOrange[500],
            }}
          >
            {!selectedImage && 'N'}
          </Avatar>
        </Badge>

        <Box sx={{ ml: 2, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography>
            <PersonIcon sx={{ mr: 1 }} />
            Kshitij Chauhan
          </Typography>
          <Typography>
            <AlternateEmailIcon sx={{ mr: 1 }} />
            jghjsfw3
          </Typography>
          <Typography>
            <EmailIcon sx={{ mr: 1 }} />
            Email: shuttlr@tech.cp
          </Typography>
        </Box>
      </Card>

      <Card
        sx={{
          m: 2,
          width: '100%',
          height: 400,
          boxShadow: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography>
          <LockOutlineIcon sx={{ mr: 1 }} />
          Change Password
        </Typography>
        <TextField id="current-password" label="Current Password" variant="filled" type="password" />
        <TextField id="new-password" label="New Password" variant="filled" type="password" />
        <TextField id="confirm-password" label="Confirm Password" variant="filled" type="password" />
        <Button variant="contained">Change Password</Button>
      </Card>
    </Box>
  );
};

export default Profile;
