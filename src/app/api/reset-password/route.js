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
    const { email, otp, newPassword } = body;

    // Validate required fields
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Proxy to backend API if NEXT_PUBLIC_API_URL is set
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Password reset failed' },
          { status: response.status, headers: corsHeaders }
        );
      }

      return NextResponse.json(data, { status: 200, headers: corsHeaders });
    }
    
    // TODO: Implement password reset logic here if no external backend
    return NextResponse.json(
      { message: 'Reset password endpoint - backend logic needs to be implemented' },
      { status: 501, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
