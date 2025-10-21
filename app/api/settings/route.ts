import { NextRequest, NextResponse } from 'next/server';
import { getSettings, isOrderWindowOpen, isOrderDeadlinePassed, getPickupInfo } from '../../lib/settings-supabase';

export async function GET() {
  try {
    const settings = await getSettings();
    const orderWindowOpen = await isOrderWindowOpen();
    const deadlinePassed = await isOrderDeadlinePassed();
    const pickupInfo = await getPickupInfo();

    return NextResponse.json({
      settings,
      orderWindowOpen,
      deadlinePassed,
      pickupInfo
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
} 