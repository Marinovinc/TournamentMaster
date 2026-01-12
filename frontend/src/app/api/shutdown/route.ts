import { NextRequest, NextResponse } from 'next/server';

const SHUTDOWN_SECRET = process.env.SHUTDOWN_SECRET || 'tm-local-shutdown-2024';

export async function POST(request: NextRequest) {
  // Check if request is from localhost
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';

  const isLocalhost = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'].some(
    ip => clientIp.includes(ip)
  );

  if (!isLocalhost) {
    return NextResponse.json(
      { success: false, message: 'Forbidden: not localhost' },
      { status: 403 }
    );
  }

  // Check secret from header or body
  const headerSecret = request.headers.get('x-shutdown-secret');
  let bodySecret: string | undefined;

  try {
    const body = await request.json();
    bodySecret = body?.secret;
  } catch {
    // Body parsing failed, that's ok
  }

  const secret = headerSecret || bodySecret;

  if (secret !== SHUTDOWN_SECRET) {
    return NextResponse.json(
      { success: false, message: 'Invalid shutdown secret' },
      { status: 401 }
    );
  }

  // Send response before shutting down
  const response = NextResponse.json({
    success: true,
    message: 'Frontend server shutting down...'
  });

  // Schedule shutdown after response is sent
  setTimeout(() => {
    console.log('Graceful shutdown initiated by server manager');
    process.exit(0);
  }, 500);

  return response;
}
