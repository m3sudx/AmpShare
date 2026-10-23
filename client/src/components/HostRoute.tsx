import { Outlet } from "react-router";
import { useAuth } from "../context/useAuth"; // same path as above
import BecomeHostPage from "../pages/host/BecomeHostPage";

export default function HostRoute() {
  const { user } = useAuth();
  const isHost = (user?.roles as string[] | undefined)?.includes("HOST");

  return isHost ? <Outlet /> : <BecomeHostPage />;
}