import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import PageContainer from "./PageContainer";
import TaskAssistantModal from "../../components/ui/TaskAssistantModal"; // Adjust path as needed

function AppLayout() {
  // We control if the modal is open from the very top level
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Pass a function to TopNav so a button there can open the modal */}
      <TopNav onOpenAssistant={() => setIsAssistantOpen(true)} />
      
      <PageContainer>
        <Outlet />
      </PageContainer>

      {/* The modal sits on top of everything, but is hidden until isAssistantOpen is true */}
      <TaskAssistantModal 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
    </div>
  );
}

export default AppLayout;