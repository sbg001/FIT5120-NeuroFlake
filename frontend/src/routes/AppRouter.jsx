import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import ChildDashboard from "../pages/ChildDashboard";
import TaskFlow from "../pages/TaskFlow";
import FocusMode from "../pages/FocusMode";
import Rewards from "../pages/Rewards";
import ParentDashboard from "../pages/ParentDashboard";
import NotFound from "../pages/NotFound";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="child" element={<ChildDashboard />} />
          <Route path="tasks" element={<TaskFlow />} />
          <Route path="focus" element={<FocusMode />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="parent" element={<ParentDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;