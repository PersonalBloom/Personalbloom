import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()
    if (!subscriptionId) return NextResponse.json({ error: 'No subscription ID' }, { status: 400 })

    // Cancel at period end (user keeps access until end of billing cycle)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      cancelled: true,
      endsAt: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
  } catch (err: any) {
    console.error('Cancel error:', err)
    return NextResponse.json({ error: err.message || 'Failed to cancel' }, { status: 500 })
  }
}
