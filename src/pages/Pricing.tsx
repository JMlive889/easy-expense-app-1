import React from 'react'
import { SubscriptionCard } from '../components/subscription/SubscriptionCard'
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus'
import { AuthGuard } from '../components/auth/AuthGuard'
import { useSubscription } from '../hooks/useSubscription'
import { useLicenses } from '../hooks/useLicenses'
import { stripeProducts } from '../stripe-config'
import { AppHeader } from '../components/AppHeader'
import QuickActions from '../components/QuickActions'
import { PageType } from '../App'
import { useAuth } from '../contexts/AuthContext'

interface PricingProps {
  onNavigate: (page: PageType) => void
  previousPage?: PageType
}

export function Pricing({ onNavigate, previousPage = 'dashboard' }: PricingProps) {
  const { profile } = useAuth()
  const { subscription } = useSubscription()
  const { usage } = useLicenses()

  const handleBackClick = () => {
    if (previousPage === 'settings') {
      onNavigate('settings')
    } else {
      onNavigate('dashboard')
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <AppHeader
          pageTitle="Subscription"
          currentPage="pricing"
          onNavigate={onNavigate}
          onBack={handleBackClick}
          headerVisible={profile?.header_visible ?? true}
        />

        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Choose Your Plan
            </h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Select the perfect plan for your needs
            </p>
          </div>

          <div className="mb-6 max-w-4xl mx-auto">
            <SubscriptionStatus />
          </div>

          <div className="mb-6 max-w-4xl mx-auto">
            <QuickActions />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stripeProducts.map((product) => (
              <SubscriptionCard
                key={product.priceId}
                product={product}
                isCurrentPlan={subscription?.price_id === product.priceId && subscription?.subscription_status === 'active'}
                currentProductName={subscription?.product_name}
                onNavigate={onNavigate}
                usage={usage}
              />
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}