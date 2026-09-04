import { NextResponse, type NextRequest } from "next/server";
import { controlPlaneHostDecision } from "@/lib/controlPlaneHost.mjs";
import { DEVICE_LINE_HEADER, deviceLineFromHost, lineHomePath } from "@/lib/deviceLine";

/**
 * Төхөөрөмжийн domain шугамыг Host-оор нь салгана.
 *
 * (Next 16-д `middleware.ts` нь `proxy.ts` болж нэрлэгдсэн — функцийн нэр мөн
 * `proxy`. Үйлдэл нь өмнөхтэй ижил.)
 *
 * Хөтчийн шугам (`nexus.gerege.mn`) дээр энэ файл юу ч хийхгүй — толгой
 * нэмэхгүй, шилжүүлэхгүй. Хөтчийн горим ямар ч нөхцөлд өөрчлөгдөхгүй гэсэн
 * гэрээний нөхцөл эндээс эхэлнэ.
 *
 * Төхөөрөмжийн шугам дээр хийх зүйл гурав:
 *
 * 1. `/` дээр тухайн шугамын өөрийн нүүр дэлгэц рүү шилжүүлнэ. Шугам бүр
 *    өөрийн нүүрээ (`/line/<line>`) өөрөө хөгжүүлнэ.
 *
 *    Rewrite биш redirect: rewrite үед хөтчийн хаяг `/` хэвээр үлддэг тул
 *    client талын router динамик сегментийг олж харахгүй, `useParams()` хоосон
 *    ирнэ. Redirect нь тэр эргэлзээг арилгаад зогсохгүй, аль шугам дээр байгааг
 *    хаягаас нь шууд уншуулна — оношлоход хамаагүй хялбар.
 *
 * 2. `/login` руу орохыг хаана. Тэдгээр шугам дээр нэвтрэлт бол native UI —
 *    web-ийн нэвтрэх дэлгэц бүрхүүлийн дотор гарч ирвэл хэрэглэгч нэг апп
 *    дотроос хоёр өөр нэвтрэлт хардаг болно. Session байхгүй үед бүрхүүл
 *    өөрөө `auth.reLogin`-оор нэвтрэлтээ эхлүүлнэ.
 *
 * 3. Тухайн шугамын нэрийг доош дамжуулж, `Vary: Host` тавина. Шугамууд нэг
 *    ижил зам дээр өөр өөр агуулга үйлчилдэг тул үүнгүйгээр CDN нэг шугамын
 *    хариуг нөгөөд өгөх боломжтой.
 */
/**
 * Screens that changed address when two apps became one.
 *
 * Handled here rather than by a page that calls `redirect()`, because a page
 * cannot. The root layout is rendered per request and streams, so by the time a
 * nested page asks for a redirect the response has already begun and Next can
 * only finish it with a client-side navigation: a 200 carrying an instruction.
 * That is fine for a browser and no use to a crawler, a link checker, or
 * anything reading the status code — which is most of what a permanent move is
 * announced to. Middleware runs before any of that and can answer 308.
 *
 * The old page files stay as a backstop for anything that reaches rendering
 * anyway; this is what actually answers.
 */
const MOVED: Record<string, string> = {};

/** Values that may legitimately receive browser-side connections. */
function configuredConnectOrigins(): string[] {
  const out = new Set<string>(["'self'"]);
  for (const candidate of [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL,
    process.env.NEXT_PUBLIC_SENTRY_DSN,
  ]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") out.add(url.origin);
    } catch {
      // Relative API paths are already covered by 'self'. Invalid deployment
      // values are rejected by their consumer rather than broadening CSP.
    }
  }
  if (process.env.NODE_ENV === "development") {
    out.add("http:");
    out.add("ws:");
  }
  return [...out];
}

function securityContext(request: NextRequest) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));
  const scriptDev = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptDev}`,
    // PetroNet uses React style attributes for live gauges, map sizing and
    // deployment-controlled colours. CSS cannot execute JavaScript; scripts
    // remain nonce-only above.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src ${configuredConnectOrigins().join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  // Next reads the request-side CSP to put the nonce on its bootstrap scripts.
  // A response-only policy has a nonce no emitted script can satisfy.
  headers.set("Content-Security-Policy", csp);
  return { csp, headers };
}

function secure(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Unlike the public-only eID site, PetroNet uses these three capabilities on
  // its map and assistant. Keep them same-origin instead of disabling them.
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), bluetooth=()",
  );
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  return response;
}

export function proxy(request: NextRequest) {
  const { csp, headers: requestHeaders } = securityContext(request);
  const controlPlane = controlPlaneHostDecision(
    request.headers.get("host"),
    process.env.CONTROL_PLANE_HOST,
    request.nextUrl.pathname,
  );

  if (controlPlane === "redirect") {
    const target = request.nextUrl.clone();
    target.pathname = "/cp";
    target.search = "";
    const response = NextResponse.redirect(target, 308);
    response.headers.set("Vary", "Host");
    return secure(response, csp);
  }

  if (controlPlane === "not-found") {
    return secure(new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store", Vary: "Host" },
    }), csp);
  }

  if (controlPlane === "allow") {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Vary", "Host");
    return secure(response, csp);
  }

  const moved = MOVED[request.nextUrl.pathname];
  if (moved) {
    const target = request.nextUrl.clone();
    target.pathname = moved;
    return secure(NextResponse.redirect(target, 308), csp);
  }

  const line = deviceLineFromHost(request.headers.get("host"));
  if (!line) {
    return secure(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/" || pathname === "/login") {
    const target = request.nextUrl.clone();
    target.pathname = lineHomePath(line);
    target.search = "";
    const redirect = NextResponse.redirect(target);
    redirect.headers.set("Vary", "Host");
    return secure(redirect, csp);
  }

  requestHeaders.set(DEVICE_LINE_HEADER, line.line);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(DEVICE_LINE_HEADER, line.line);
  response.headers.set("Vary", "Host");
  return secure(response, csp);
}

export const config = {
  // Статик хөрөнгө, зураг, manifest дээр ажиллуулах шаардлагагүй — тэдгээр нь
  // шугамаас үл хамааран ижил.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|brand.webp|manifest.webmanifest|api/health).*)"],
};
