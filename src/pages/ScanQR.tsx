import { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Box, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useWebRTCStore from '../store/webrtcStore';

import Logo from "../assets/double-black.svg";
const ScanQR = () => {
  const [roomName, setRoomName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { initialize } = useWebRTCStore();
  const navigate = useNavigate();
  const timeouts = useRef<number[]>([]);

  // Handle navigation when connection is established
  useEffect(() => {
    const unsubscribe = useWebRTCStore.subscribe((state) => {
      if (state.isConnected) {
        console.log('[UI] Connection established, navigating to transfer page');
        // Clear all timeouts
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];
        setIsJoining(false);
        // Small delay to ensure everything is ready
        setTimeout(() => navigate('/transfer'), 100);
      } else if (state.error) {
        setError(state.error);
        setIsJoining(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !user) return;
    
    // Clear any existing timeouts
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    
    setIsJoining(true);
    setError(null);
    console.log(`[UI] Joining room: ${roomName} as ${user.name}`);
    
    try {
      // Set a timeout for the connection process
      const connectionTimeout = window.setTimeout(() => {
        const { isConnected, error: connectionError } = useWebRTCStore.getState();
        if (!isConnected) {
          console.log('[UI] Connection timeout reached. Current state:', { isConnected, connectionError });
          setError('Connection is taking longer than expected. Please check if the room ID is correct and try again.');
          setIsJoining(false);
        }
      }, 30000);
      timeouts.current.push(connectionTimeout);
      
      // Initialize the connection as receiver (isCaller = false)
      console.log('[UI] Initializing WebRTC connection as receiver...');
      await initialize(roomName, user, false);
      console.log('[UI] Joined room successfully, waiting for connection...');
      
    } catch (error) {
      console.error('[UI] Error joining room:', error);
      setError('Failed to join the room. Please check the room ID and try again.');
      setIsJoining(false);
      
      // Clear any pending timeouts
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

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
               
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500}}>

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
          Join a Room
        </Typography>

          <Box component="form" onSubmit={handleJoinRoom} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="room"
              label="Room ID"
              name="room"
              autoComplete="off"
              autoFocus
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.toUpperCase())}
              disabled={isJoining}
              inputProps={{
                style: { textTransform: 'uppercase' },
                maxLength: 6
              }}
              helperText="Enter the 6-character room ID"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
               sx={{
                backgroundColor: '#fbbb52',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#e0a842',
                },
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            
              disabled={!roomName || roomName.length !== 6 || isJoining}
            >
              {isJoining ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>
            
            {error && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ScanQR;
