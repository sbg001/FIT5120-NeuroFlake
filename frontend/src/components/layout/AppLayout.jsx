import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import PageContainer from "./PageContainer";

function AppLayout() {
  return (
    <div className="app-shell">
      <TopNav />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </div>
  );
}

export default AppLayout;