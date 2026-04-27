import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import PageContainer from "./PageContainer";
import FloatingCompanion from "../ui/FloatingCompanion";

function AppLayout() {

  return (
    <div className="app-shell">
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
      <FloatingCompanion />
    </div>
  );
}

export default AppLayout;
