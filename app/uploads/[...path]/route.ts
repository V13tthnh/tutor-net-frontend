import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
  const backendHost = new URL(backendApiUrl).origin; // e.g. http://localhost:8080

  let pathname = request.nextUrl.pathname;
  // Clean double /uploads/uploads/ to single /uploads/
  pathname = pathname.replace(/^\/(uploads\/)+/, '/uploads/');

  const targetUrl = `${backendHost}${pathname}`;

  // DEBUG — xóa sau khi fix xong
  console.log('[uploads proxy] raw pathname:', request.nextUrl.pathname);
  console.log('[uploads proxy] cleaned pathname:', pathname);
  console.log('[uploads proxy] targetUrl:', targetUrl);

  try {
    const res = await fetch(targetUrl, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return new NextResponse('Not Found', { status: res.status });
    }

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding'].includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    });

    const responseData = await res.arrayBuffer();
    return new NextResponse(responseData, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Failed to proxy uploads image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
