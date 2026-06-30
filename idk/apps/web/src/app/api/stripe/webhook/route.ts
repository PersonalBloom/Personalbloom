import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Service role client — bypasses RLS so we can update any profile
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function setUserPlan(userId: string, plan: 'soul_plus' | 'free', stripeSubId?: string) {
  if (!userId) return
  const supabase = getAdminSupabase()
  const update: Record<string, string> = { plan }
  if (stripeSubId) update.stripe_subscription_id = stripeSubId
  const { error } = await supabase.from('profiles').update(update).eq('id', userId)
  if (error) console.error('Supabase plan update error:', error)
  else console.log(`Set plan=${plan} for user ${userId}`)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    // Payment succeeded — upgrade user
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (userId) await setUserPlan(userId, 'soul_plus')
      break
    }

    // Subscription renewed or reactivated
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (userId) {
        const plan = (sub.status === 'active' || sub.status === 'trialing') ? 'soul_plus' : 'free'
        await setUserPlan(userId, plan, sub.id)
      }
      break
    }

    // Subscription cancelled or payment permanently failed — downgrade
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const obj = event.data.object as Stripe.Subscription | Stripe.Invoice
      const userId = (obj as Stripe.Subscription).metadata?.supabase_user_id
        ?? (obj as Stripe.Invoice).subscription_details?.metadata?.supabase_user_id
      if (userId) await setUserPlan(userId, 'free')
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
