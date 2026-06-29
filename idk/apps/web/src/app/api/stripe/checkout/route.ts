import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const { promoCode, billing = 'monthly' } = await req.json()

    const origin = req.headers.get('origin') || 'https://personalbloom1.vercel.app'

    // Pick the right price ID based on billing period
    const priceId = billing === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY!
      : process.env.STRIPE_PRICE_ID_MONTHLY!

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: 3,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      allow_promotion_codes: !promoCode,
      currency: 'eur',
    }

    // Apply promo code if provided
    if (promoCode) {
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      })
      if (promoCodes.data.length > 0) {
        params.discounts = [{ promotion_code: promoCodes.data[0].id }]
        params.allow_promotion_codes = false
      } else {
        return NextResponse.json({ error: 'Code promo invalide ou expiré.' }, { status: 400 })
      }
    }

    const session = await stripe.checkout.sessions.create(params)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création de la session.' }, { status: 500 })
  }
}
