import { Outlet } from "react-router-dom";
import PageContainer from "./PageContainer";
import TopNav from "./TopNav";
import AnimatedBackground from "../ui/AnimatedBackground";
import FloatingCompanion from "../ui/FloatingCompanion";

function AppLayout() {
  return (
    <div className="app-shell">
      <AnimatedBackground />
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
      <FloatingCompanion />
    </div>
  );
}

export default AppLayout;
