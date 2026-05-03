import { Outlet, useLocation } from "react-router-dom";
import PageContainer from "./PageContainer";
import TopNav from "./TopNav";
import AnimatedBackground from "../ui/AnimatedBackground";
import FloatingCompanion from "../ui/FloatingCompanion";

function AppLayout() {
  const isLoggedIn = Boolean(localStorage.getItem("current_user_id"));
  const location = useLocation();

  const hideCompanionPaths = ["/", "/login", "/signup"];
  const shouldShowCompanion = !hideCompanionPaths.includes(location.pathname);

  return (
    <div className="app-shell">
      <AnimatedBackground />
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
      {shouldShowCompanion && isLoggedIn && <FloatingCompanion />}
    </div>
  );
}

export default AppLayout;
