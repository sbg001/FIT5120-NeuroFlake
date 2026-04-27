import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import PageContainer from "./PageContainer";
import AnimatedBackground from "../ui/AnimatedBackground";

function AppLayout() {

  return (
    <div className="app-shell">
      <AnimatedBackground />
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </div>
  );
}

export default AppLayout;
