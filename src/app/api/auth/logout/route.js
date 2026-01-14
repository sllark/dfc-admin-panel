import { NextResponse } from 'next/server';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    // Proxy to backend API if NEXT_PUBLIC_API_URL is set
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/auth/logout`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: 200, headers: corsHeaders });
      } catch (error) {
        // If backend doesn't have logout endpoint, just return success
        return NextResponse.json(
          { message: 'Logout successful' },
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Logout is typically handled client-side (clearing tokens)
    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200, headers: corsHeaders }
    );
  }
}
