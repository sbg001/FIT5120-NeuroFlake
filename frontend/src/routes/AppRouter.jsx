import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ChildDashboard from "../pages/ChildDashboard";
import TaskFlow from "../pages/TaskFlow";
import FocusMode from "../pages/FocusMode";
import Rewards from "../pages/Rewards";
import ParentDashboard from "../pages/ParentDashboard";
import NotFound from "../pages/NotFound";

function ProtectedRoute({ children }) {
  const currentUserId = localStorage.getItem("current_user_id");

  if (!currentUserId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/child" element={<ChildDashboard />} />
          <Route path="/tasks/:taskId" element={<TaskFlow />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/parent" element={<ParentDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;