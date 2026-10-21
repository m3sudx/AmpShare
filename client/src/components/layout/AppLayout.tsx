import { Outlet } from "react-router";
import TopNav from "./TopNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAF9]">
      <TopNav />

      <main className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}