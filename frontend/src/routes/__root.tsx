import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2 text-lg absolute top-0 left-0 mt-5 ml-5">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/gallery" className="[&.active]:font-bold">
          Gallery
        </Link>
      </div>

      {/* Add your navigation links and layout components here */}
      <Outlet />
    </>
  ),
});
