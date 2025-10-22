import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from './supabase-server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
}

export async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Authentication required' };
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Verify the Supabase JWT token
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Check if user is admin
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (user.email !== adminEmail) {
      return { success: false, error: 'Admin access required' };
    }

    return {
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        isAdmin: true
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Invalid authentication token' };
  }
}

export function createAuthenticatedHandler(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Admin access required' ? 403 : 401 }
      );
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;

    return handler(authenticatedRequest);
  };
}