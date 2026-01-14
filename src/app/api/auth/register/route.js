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

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password, phone } = body;

    // Validate required fields
    if (!username || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Proxy to backend API if NEXT_PUBLIC_API_URL is set
    // Otherwise, you need to implement the registration logic here
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Registration failed' },
          { status: response.status, headers: corsHeaders }
        );
      }

      return NextResponse.json(data, { status: 201, headers: corsHeaders });
    }
    
    // TODO: Implement registration logic here if no external backend
    // This should include database operations, password hashing, etc.
    return NextResponse.json(
      { message: 'Registration endpoint - backend logic needs to be implemented' },
      { status: 501, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
