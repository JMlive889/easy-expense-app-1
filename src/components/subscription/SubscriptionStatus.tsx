import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { useSubscription } from '../../hooks/useSubscription'
import { useLicenses } from '../../contexts/LicenseContext'
import { getLicenseLimitsByProductName } from '../../stripe-config'
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'

export function SubscriptionStatus() {
  const { subscription, loading, error } = useSubscription()
  const { usage } = useLicenses()

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading subscription...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="error">
        Failed to load subscription: {error}
      </Alert>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subscription Status</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">No active subscription</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'trialing':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'past_due':
      case 'unpaid':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600'
      case 'trialing':
        return 'text-blue-600'
      case 'past_due':
      case 'unpaid':
        return 'text-yellow-600'
      case 'canceled':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subscription Status</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(subscription.subscription_status || '')}
            <span className={`ml-2 font-medium ${getStatusColor(subscription.subscription_status || '')}`}>
              {subscription.subscription_status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {subscription.product_name && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {subscription.product_name}
            </span>
          )}
        </div>

        {subscription.current_period_end && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
            {formatDate(subscription.current_period_end)}
          </div>
        )}

        {subscription.payment_method_brand && subscription.payment_method_last4 && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Payment method: {subscription.payment_method_brand.toUpperCase()} ending in {subscription.payment_method_last4}
          </div>
        )}

        {subscription.product_name && (() => {
          const limits = getLicenseLimitsByProductName(subscription.product_name)
          if (!limits || (limits.adminLicenses === 0 && limits.guestLicenses === 0)) {
            return null
          }

          const adminUsed = usage.active_admin_count + usage.invited_admin_count
          const guestUsed = usage.active_guest_count + usage.invited_guest_count

          const parts = []
          if (limits.adminLicenses > 0) {
            parts.push(`${adminUsed}/${limits.adminLicenses} Admin`)
          }
          if (limits.guestLicenses > 0) {
            parts.push(`${guestUsed}/${limits.guestLicenses} Guest`)
          }

          return (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Licenses: {parts.join(', ')} in use
            </div>
          )
        })()}

        {subscription.cancel_at_period_end && (
          <Alert variant="warning">
            Your subscription will not renew and will end on{' '}
            {subscription.current_period_end && formatDate(subscription.current_period_end)}.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}