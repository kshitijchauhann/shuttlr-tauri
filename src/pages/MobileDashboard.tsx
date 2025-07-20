import React, { useState, useRef, useEffect } from 'react';
import SouthIcon from '@mui/icons-material/South';
import NorthIcon from '@mui/icons-material/North';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Logo from "../assets/double-black.svg";
import { useNavigate } from 'react-router-dom';

const MobileDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFileURL(URL.createObjectURL(file));
      setFileName(file.name);
    } else {
      alert("Please select a valid image file.");
    }
  };

  useEffect(() => {
    return () => {
      if (fileURL) URL.revokeObjectURL(fileURL);
    };
  }, [fileURL]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <img src={Logo} width="360px" style={{ margin: '30px' }} />

      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4, m: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/create-room")}
          sx={{
            backgroundColor: '#fbbb52',
            width: '80px',
            height: '60px',
            flexShrink: 0
          }}
        >
          <NorthIcon />
        </Button>

        <Button
          variant="contained"
          onClick={() => navigate("/scan")}
          sx={{
            backgroundColor: '#fbbb52',
            width: '80px',
            height: '60px',
            flexShrink: 0
          }}
        >
          <SouthIcon />
        </Button>
      </Box>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Image Preview */}
      {fileURL && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>{fileName}</Typography>
          <Box sx={{ maxWidth: '90vw', maxHeight: '60vh' }}>
            <img src={fileURL} alt="Preview" style={{ width: '100%', height: 'auto' }} />
          </Box>
          <Button onClick={() => navigate("/qr")} sx={{backgroundColor: '#fbbb52', color:"white"}}>Send</Button>
        </Box>
      )}
    </Box>
  );
};

export default MobileDashboard;
