import { useState } from "react";
import {
  Box,
  Card,
  Button,
  Typography,
  Avatar,
  Badge,
  TextField,
  IconButton,
  InputAdornment,
  Tab,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AlternateEmail as AlternateEmailIcon,
  LockOutline as LockOutlineIcon,
  PhotoCamera,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { deepOrange, grey } from "@mui/material/colors";
import { TabList, TabPanel, TabContext } from "@mui/lab";

import axios from "axios";
import Logo from "../assets/double-black.svg";
import useAuthStore from "../store/authStore";

const Profile = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [value, setValue] = useState("1");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const currentUser = useAuthStore((state) => state.user);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      console.log("Selected file:", file.name);
    }
  };

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword((prev) => !prev);
  };
  const handleClickShowNewPassword = () => {
    setShowNewPassword((prev) => !prev);
  };
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "https://shuttlr.onrender.com/api/change-password",
        {
          email: currentUser?.email,
          currentPassword,
          newPassword,
        },
      );

      if (response.status === 200) {
        alert("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Password change failed:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to change password. Please try again.",
      );
    }
  };

  return (
    <Box
      sx={{
        height: "90vh",
        px: { xs: 2, md: 6 },
        py: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ my: 2 }}>
        <img src={Logo} width="350px" alt="Logo" style={{ maxWidth: "100%" }} />
      </Box>

      <TabContext value={value}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TabList
            onChange={handleChange}
            aria-label="profile tabs"
            sx={{
              width: "100%",
              "& .MuiTabs-flexContainer": {
                justifyContent: "center",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#ffb570",
              },
            }}
          >
            <Tab
              label="Profile"
              value="1"
              sx={{
                flexGrow: 1,
                "&.Mui-selected": {
                  color: "#ffb570",
                  fontWeight: 700,
                },
                color: grey[700],
              }}
            />
            <Tab
              label="Change Password"
              value="2"
              sx={{
                flexGrow: 1,
                "&.Mui-selected": {
                  color: "#ffb570",
                  fontWeight: 700,
                },
                color: grey[700],
              }}
            />
          </TabList>
        </Box>

        {/* Profile Tab */}
        <TabPanel
          value="1"
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            p: 0,
          }}
        >
          <Card
            sx={{
              boxShadow: 4,
              width: "100%",
              maxWidth: 900,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: { xs: 2, md: 4 },
              mt: 3,
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#fff",
                  boxShadow: 2,
                  borderRadius: "50%",
                  height: 30,
                  width: 30,
                  transform: "scale(1) translate(25%, 25%)",
                },
              }}
              badgeContent={
                <label htmlFor="upload-profile-pic">
                  <input
                    accept="image/*"
                    id="upload-profile-pic"
                    type="file"
                    style={{ display: "none" }}
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
                  mx: "auto",
                  mb: 3,
                }}
              >
                {!selectedImage && currentUser?.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "N"}
              </Avatar>
            </Badge>

            <Box
              sx={{
                width: "100%",
                maxWidth: 500,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {[
                {
                  icon: <PersonIcon sx={{ color: "grey" }} />,
                  label: "Name",
                  value: currentUser?.name || "",
                },
                {
                  icon: <AlternateEmailIcon sx={{ color: "grey" }} />,
                  label: "Username",
                  value: currentUser?.userName || "",
                },
                {
                  icon: <EmailIcon sx={{ color: "grey" }} />,
                  label: "Email",
                  value: currentUser?.email || "",
                },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFF7F2",
                    borderRadius: "15px",
                    px: 2,
                    py: 1,
                  }}
                >
                  {item.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: "grey" }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </TabPanel>

        {/* Change Password Tab */}
        <TabPanel
          value="2"
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            p: 0,
          }}
        >
          <Card
            sx={{
              width: "100%",
              maxWidth: 900,
              boxShadow: 4,
              p: { xs: 2, md: 4 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              mt: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <LockOutlineIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>
                Change Password
              </Typography>
            </Box>

            <TextField
              fullWidth
              color="black"
              sx={{ backgroundColor: "#FFF7F2" }}
              id="current-password"
              label="Current Password"
              variant="outlined"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowCurrentPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              color="black"
              sx={{ backgroundColor: "#FFF7F2" }}
              id="new-password"
              label="New Password"
              variant="outlined"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowNewPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              color="black"
              sx={{ backgroundColor: "#FFF7F2" }}
              id="confirm-password"
              label="Confirm Password"
              variant="outlined"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              sx={{ backgroundColor: "#ffb570", fontWeight: 700 }}
              onClick={handleChangePassword}
            >
              Change Password
            </Button>
          </Card>
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default Profile;
