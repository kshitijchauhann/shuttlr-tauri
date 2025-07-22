import Logo from "../assets/double-black.svg";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import type { User } from "../store/authStore";

import useAuthStore from "../store/authStore";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { login, setUser } = useAuthStore();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };
  const handleMouseUpPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const result = await login(formData);

      if (result.success) {
        setUser(result.user as User | null);
        setOpen(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Box
      sx={{
        height: "90vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "white",
            padding: 4,
            borderRadius: 2,
            boxShadow: 5,
          }}
        >
          {/* Logo */}
          <img src={Logo} width="320px" style={{ marginBottom: "50px" }} />

          {/* Form */}
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <TextField
              name="email"
              label="Enter email"
              type="email"
              variant="outlined"
              fullWidth
              sx={{
                backgroundColor: "#FFF7F2",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "black",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "black",
                },
                "& .MuiInputLabel-root": {
                  color: "black",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ffb570",
                },
                mb: 2,
              }}
              value={formData.email}
              onChange={handleChange}
            />
            {formData.email &&
              (!formData.email.includes("@") ||
                !formData.email.includes(".")) && (
                <Typography color="error" sx={{ mb: 2 }}>
                  Enter a valid email
                </Typography>
              )}

            <TextField
              name="password"
              label="Enter password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              sx={{
                backgroundColor: "#FFF7F2",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "black",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "black",
                },
                "& .MuiInputLabel-root": {
                  color: "black",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ffb570",
                },
                mb: 2,
              }}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      onMouseUp={handleMouseUpPassword}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              size="large"
              sx={{
                backgroundColor: "#ffb570",
                fontWeight: 700,
              }}
            >
              LOGIN
            </Button>

            <Snackbar
              open={open}
              autoHideDuration={6000}
              onClose={handleClose}
              message="Login successful"
            />

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Don't have an account?{" "}
              <Button
                variant="text"
                onClick={() => navigate("/signup")}
                sx={{
                  fontWeight: 700,
                  color: "#ffb570",
                  textTransform: "none",
                  padding: 0,
                  minWidth: "unset",
                }}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
