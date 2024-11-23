// middleware.ts
import {NextRequest} from "next/server";
import {NextResponse} from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token");
  const isWelcomePage = req.nextUrl.pathname === "/welcome";
  const isAuthPage = ["/login", "/register"].includes(req.nextUrl.pathname);
  const isPublicPage = isWelcomePage || isAuthPage;

  // If user is authenticated and tries to access public pages (welcome/login/register)
  if (token && isPublicPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and tries to access protected pages
  // But allow access to welcome, login, and register pages
  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/welcome", "/login", "/register", "/username"],
};
