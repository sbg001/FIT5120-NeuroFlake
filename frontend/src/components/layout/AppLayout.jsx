import { Outlet } from "react-router-dom";
import PageContainer from "./PageContainer";
import TopNav from "./TopNav";
import AnimatedBackground from "../ui/AnimatedBackground";
import FloatingCompanion from "../ui/FloatingCompanion";

function AppLayout() {
  const isLoggedIn = Boolean(localStorage.getItem("current_user_id"));

  return (
    <div className="app-shell">
      <AnimatedBackground />
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
      {isLoggedIn ? <FloatingCompanion /> : null}
    </div>
  );
}

export default AppLayout;
