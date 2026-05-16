import React, { useState, type ReactNode } from "react";
import { Navbar, Sidebar, Footer } from "../layouts/index";

interface MainLayoutProps {
  content: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ content }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
      <div className="min-h-screen bg-main-bg">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} />
        <div className="sm:ml-64 pt-16 flex flex-col min-h-screen">
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden" 
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <main className="grow p-4 md:p-6">
            <div className="mx-auto max-w-7xl mt-3">
              {content}
            </div>
          </main>
          <Footer />
        </div>
      </div>
  );
  
};

export default MainLayout;