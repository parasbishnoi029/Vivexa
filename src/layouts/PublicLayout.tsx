import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="w-full h-full min-h-screen bg-[#030712]">
      <Outlet />
    </div>
  );
}
