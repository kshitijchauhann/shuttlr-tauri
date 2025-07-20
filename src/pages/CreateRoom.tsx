import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import useWebRTCStore from '../store/webrtcStore';
import AddIcon from '@mui/icons-material/Add';

import Logo from "../assets/double-black.svg";
const CreateRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { initialize } = useWebRTCStore();
  const navigate = useNavigate();
  const roomIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  }, []);

  useEffect(() => {
    const unsubscribe = useWebRTCStore.subscribe((state) => {
      if (state.isConnected) {
        setIsCreating(false);
        navigate('/transfer');
      } else if (state.error) {
        setError(state.error);
        setIsCreating(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!roomId || !user) return;

    setIsCreating(true);
    setError(null);

    try {
      await initialize(roomId, user, true); // isCaller = true for room creator
    } catch (error) {
      console.error('[UI] Error creating room:', error);
      setError('Failed to create room. Please try again.');
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (roomIdRef.current) {
      roomIdRef.current.select();
      document.execCommand('copy');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: { xs: 6, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
        }}
      >

        <img src={Logo} width="360px" style={{ margin: '30px' }} />

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: 500,
          }}
        >

        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: { xs: 2, sm: 3 },
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: { xs: '1.8rem', sm: '2.125rem' },
          }}
        >
          Create a New Room
        </Typography>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Share this Room ID with others:
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              value={roomId}
              inputRef={roomIdRef}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={copyToClipboard} edge="end">
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleCreateRoom}
              disabled={isCreating || !roomId}
              startIcon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{
                backgroundColor: '#fbbb52',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#e0a842',
                },
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </Button>
          </Box>

          {error && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {isCreating && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Waiting for another peer to join...
              </Typography>
              <CircularProgress sx={{ mt: 2 }} />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateRoom;
