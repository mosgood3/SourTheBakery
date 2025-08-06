import { NextRequest, NextResponse } from 'next/server';
import { auth } from './firebase-admin';

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

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    if (decodedToken.email !== 'sourthebakeryllc@gmail.com') {
      return { success: false, error: 'Admin access required' };
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
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