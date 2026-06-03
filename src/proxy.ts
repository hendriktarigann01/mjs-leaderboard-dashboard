import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ambil token dari cookie
  const adminToken = request.cookies.get('mjs_admin_session')?.value;
  const isLoggedIn = adminToken === 'authenticated_mjs_admin';

  // Jika mencoba mengakses halaman login tapi sudah masuk
  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Lindungi rute utama dashboard
  if (!isLoggedIn) {
    // Alihkan ke login dengan menyertakan redirect path
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Hanya terapkan proxy ke halaman login dan dashboard utama (root)
export const config = {
  matcher: [
    '/',
    '/login'
  ],
};
export { proxy as middleware }; // Tambahkan ekspor sebagai fallback jika Next.js memerlukannya secara internal
