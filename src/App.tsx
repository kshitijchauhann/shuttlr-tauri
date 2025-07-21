import Dashboard from "./pages/MobileDashboard.tsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanQR from "./pages/ScanQR.tsx";
import CreateRoom from "./pages/CreateRoom.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import FileTransferPage from "./pages/FileTransferPage.tsx";
import Profile from "./pages/UserProfile.tsx";
import Forgot from "./pages/ForgotPassword.tsx";
const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/signup" element={<SignUp/>}/>
      <Route path="/scan" element={<ScanQR />} />
      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/transfer" element={<FileTransferPage />} />
      <Route path="/profile" element={<Profile/>} />
      <Route path="/forgot" element={<Forgot/>}/>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </BrowserRouter>
  );
}
export default App;
