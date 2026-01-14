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

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (backendUrl) {
      // Get authorization header from request
      const authHeader = request.headers.get('authorization');
      
      const response = await fetch(`${backendUrl}/donors/donor-registration/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Failed to update donor' },
          { status: response.status, headers: corsHeaders }
        );
      }

      return NextResponse.json(data, { status: 200, headers: corsHeaders });
    }

    return NextResponse.json(
      { message: 'Backend API URL not configured' },
      { status: 501, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Update donor error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (backendUrl) {
      // Get authorization header from request
      const authHeader = request.headers.get('authorization');
      
      const response = await fetch(`${backendUrl}/donors/donor-registration/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || 'Failed to delete donor' },
          { status: response.status, headers: corsHeaders }
        );
      }

      return NextResponse.json(data, { status: 200, headers: corsHeaders });
    }

    return NextResponse.json(
      { message: 'Backend API URL not configured' },
      { status: 501, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete donor error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
