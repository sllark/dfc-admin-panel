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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (backendUrl) {
      // Get authorization header from request
      const authHeader = request.headers.get('authorization');
      
      // First, fetch the donor data by ID
      const donorResponse = await fetch(`${backendUrl}/donors/donor-registration/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });

      if (!donorResponse.ok) {
        const errorData = await donorResponse.json();
        return NextResponse.json(
          { message: errorData.message || 'Failed to fetch donor data' },
          { status: donorResponse.status, headers: corsHeaders }
        );
      }

      const donorData = await donorResponse.json();
      const donor = donorData.data || donorData;

      // Format date of birth if it exists
      let formattedDateOfBirth = donor.donorDateOfBirth;
      if (formattedDateOfBirth) {
        // If it's a full ISO string, extract just the date part
        if (formattedDateOfBirth.includes('T')) {
          formattedDateOfBirth = formattedDateOfBirth.split('T')[0];
        }
      }

      // Format registration expiration date if it exists
      let formattedExpirationDate = donor.registrationExpirationDate;
      if (formattedExpirationDate) {
        if (formattedExpirationDate.includes('T')) {
          formattedExpirationDate = formattedExpirationDate.split('T')[0];
        }
      }

      // Construct request body with required and optional fields
      const requestBody = {
        // Required fields
        donorNameFirst: donor.donorNameFirst || '',
        donorNameLast: donor.donorNameLast || '',
        donorSex: donor.donorSex || donor.donorGender || 'M', // Default to 'M' if not provided
        donorDateOfBirth: formattedDateOfBirth || '',
        panelId: donor.panelId || '',
        accountNumber: donor.accountNumber || '',
        
        // Optional fields
        ...(donor.donorSSN && { donorSSN: donor.donorSSN }),
        ...(donor.donorStateOfResidence && { donorStateOfResidence: donor.donorStateOfResidence }),
        ...(donor.testingAuthority && { testingAuthority: donor.testingAuthority }),
        ...(formattedExpirationDate && { registrationExpirationDate: formattedExpirationDate }),
        ...(donor.reasonForTest && { donorReasonForTest: donor.reasonForTest }),
        ...(donor.donorReasonForTest && { donorReasonForTest: donor.donorReasonForTest }),
        
        // Include labcorp registration number from the request
        ...(body.labcorpRegistrationNumber && { labcorpRegistrationNumber: body.labcorpRegistrationNumber }),
      };
      
      console.log('Confirm request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${backendUrl}/donors/donor-registration/confirm-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend error response:', data);
        return NextResponse.json(
          { message: data.message || 'Failed to confirm donor' },
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
    console.error('Confirm donor error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
