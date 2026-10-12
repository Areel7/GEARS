/* =========================================================
   ADMIN ROUTE PATHS

   The sign-in page lives on a deliberately long, non-obvious
   path. It is never linked from the public site, and nothing
   on the public site redirects to it, so the only way in is
   to already know the address.

   Change ADMIN_LOGIN_PATH here and every route, guard and
   redirect follows automatically.
========================================================= */

export const ADMIN_LOGIN_PATH =
  "/gears-control-7q4m9xk2v8-login2512hassansultanumer-5rc7kta";

/* Everything behind the sign-in lives under this prefix. */
export const ADMIN_BASE_PATH = "/admin";

/* True for any path the admin application owns. */
export const isAdminPath = (pathname) =>
  pathname === ADMIN_LOGIN_PATH ||
  pathname.startsWith(`${ADMIN_BASE_PATH}/`) ||
  pathname === ADMIN_BASE_PATH;
