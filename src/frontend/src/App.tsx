import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PaymentsPage from "./pages/PaymentsPage";
import StudentsPage from "./pages/StudentsPage";
import TeachersPage from "./pages/TeachersPage";
import { isLoggedIn } from "./utils/auth";

type Page = "dashboard" | "students" | "teachers" | "payments" | "chat";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  useEffect(() => {
    setAuthenticated(isLoggedIn());
    // Parse initial route
    const hash = window.location.hash.replace("#", "");
    if (hash === "/students") setCurrentPage("students");
    else if (hash === "/teachers") setCurrentPage("teachers");
    else if (hash === "/payments") setCurrentPage("payments");
    else if (hash === "/chat") setCurrentPage("chat");
    else setCurrentPage("dashboard");
  }, []);

  const handleLogin = () => {
    setAuthenticated(true);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setAuthenticated(false);
    window.location.hash = "#/login";
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.location.hash = `#/${page === "dashboard" ? "" : page}`;
  };

  if (!authenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {currentPage === "dashboard" && (
          <DashboardPage onNavigate={handleNavigate} />
        )}
        {currentPage === "students" && <StudentsPage />}
        {currentPage === "teachers" && <TeachersPage />}
        {currentPage === "payments" && <PaymentsPage />}
        {currentPage === "chat" && <ChatPage />}
      </Layout>
      <Toaster />
    </>
  );
}
