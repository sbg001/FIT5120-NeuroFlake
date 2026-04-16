import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import PageContainer from "./PageContainer";
import TaskAssistantModal from "../../components/ui/TaskAssistantModal"; // Adjust path as needed

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