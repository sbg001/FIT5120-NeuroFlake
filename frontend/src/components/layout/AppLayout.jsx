import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageContainer from "./PageContainer";
import TopNav from "./TopNav";
import AnimatedBackground from "../ui/AnimatedBackground";
import FloatingCompanion from "../ui/FloatingCompanion";

function AppLayout() {
  const location = useLocation();
  const isPublicGuestPath = location.pathname === "/" || location.pathname === "/login";
  const isLoggedIn = !isPublicGuestPath && Boolean(localStorage.getItem("current_user_id"));

  const hideCompanionPaths = ["/", "/login", "/signup"];
  const shouldShowCompanion = !hideCompanionPaths.includes(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

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
