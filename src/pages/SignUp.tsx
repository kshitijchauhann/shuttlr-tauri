import Logo from "../assets/double-black.svg";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

import zxcvbn from "zxcvbn";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State for Snackbar visibility, message, and severity
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");


  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();

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

  // Closes the Snackbar
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
    setSnackbarMessage(null); // Clear message on close
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      const strength = zxcvbn(value).score;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        setSnackbarMessage("Passwords do not match."); // Set specific error message
        setSnackbarSeverity("error"); // Set severity to error
        setSnackbarOpen(true);
        return;
      }

      const response = await axios.post(
        "https://shuttlr.onrender.com/api/signup",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
      );

      if (response.status === 201) {
        setSnackbarMessage("Signup successful!"); // Set success message
        setSnackbarSeverity("success"); // Set severity to success
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: any) {
      setSnackbarMessage(err.response?.data?.message || "Signup failed."); // Set error message
      setSnackbarSeverity("error"); // Set severity to error
      setSnackbarOpen(true);
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
          <img src={Logo} width="320px" style={{ marginBottom: "50px" }} alt="Logo" />

          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <TextField
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
              name="name"
              label="Enter Name"
              variant="outlined"
              fullWidth
              value={formData.name}
              onChange={handleChange}
            />

            <TextField
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
              name="email"
              label="Enter email"
              type="email"
              variant="outlined"
              fullWidth
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
                      aria-label={
                        showPassword
                          ? "hide the password"
                          : "display the password"
                      }
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

            <TextField
              name="confirmPassword"
              label="Confirm password"
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
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "hide the password"
                          : "display the password"
                      }
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

            {formData.password && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    height: 10,
                    width: "100%",
                    backgroundColor: "#e0e0e0",
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${(passwordStrength + 1) * 20}%`,
                      backgroundColor:
                        passwordStrength <= 1
                          ? "red"
                          : passwordStrength === 2
                            ? "orange"
                            : passwordStrength === 3
                              ? "yellowgreen"
                              : "green",
                      borderRadius: 1,
                      transition: "width 0.3s ease-in-out",
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {
                    ["Very Weak", "Weak", "Fair", "Good", "Strong"][
                      passwordStrength
                    ]
                  }
                </Typography>
              </Box>
            )}

            {formData.password !== formData.confirmPassword && (
              <Typography color="error" sx={{ mb: 2 }}>
                Passwords don't match
              </Typography>
            )}

            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              size="large"
              sx={{
                backgroundColor: "#ffb570",
              }}
            >
              SIGNUP
            </Button>

            {/* Updated Snackbar for consistency and mobile-friendliness */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
              <Alert
                onClose={handleClose}
                severity={snackbarSeverity} // Use dynamic severity
                sx={{ width: "100%" }} // Ensure full width on mobile
              >
                {snackbarMessage} {/* Use dynamic message */}
              </Alert>
            </Snackbar>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account?{" "}
              <Button
                variant="text"
                onClick={() => navigate("/")}
                sx={{
                  fontWeight: 700,
                  color: "#ffb570",
                  textTransform: "none",
                  padding: 0,
                  minWidth: "unset",
                }}
              >
                Login
              </Button>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;
