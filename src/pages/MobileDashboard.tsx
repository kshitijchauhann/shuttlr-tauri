import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import SouthIcon from "@mui/icons-material/South";
import NorthIcon from "@mui/icons-material/North";
import LogoutIcon from "@mui/icons-material/Logout";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Logo from "../assets/double-black.svg";

const MobileDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { user, isLoggedIn, isLoading, logout } = useAuthStore();
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
    // Redirect to login if not authenticated
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (fileURL) URL.revokeObjectURL(fileURL);
    };
  }, [fileURL]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "90vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "90vh",
        p: 2,
      }}
    >
      {/* Top Bar with Avatar and Logout */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <IconButton onClick={() => navigate("/profile")} sx={{ p: 0 }}>
          <Avatar sx={{ bgcolor: "#fbbb52" }}>
            {user.userName ? user.userName.charAt(0).toUpperCase() : "U"}
          </Avatar>
        </IconButton>

        <IconButton onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* Logo */}
      <img src={Logo} width="360px" style={{ margin: "30px" }} />

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          m: 3,
        }}
      >
        <Button
          variant="contained"
          onClick={() => navigate("/create-room")}
          sx={{
            backgroundColor: "#fbbb52",
            width: "80px",
            height: "60px",
            flexShrink: 0,
          }}
        >
          <NorthIcon />
        </Button>

        <Button
          variant="contained"
          onClick={() => navigate("/scan")}
          sx={{
            backgroundColor: "#fbbb52",
            width: "80px",
            height: "60px",
            flexShrink: 0,
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
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Image Preview */}
      {fileURL && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {fileName}
          </Typography>
          <Box sx={{ maxWidth: "90vw", maxHeight: "60vh" }}>
            <img
              src={fileURL}
              alt="Preview"
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
          <Button
            onClick={() => navigate("/qr")}
            sx={{ backgroundColor: "#fbbb52", color: "white", mt: 1 }}
          >
            Send
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MobileDashboard;
