import { Check, X } from 'lucide-react'
import { PasswordStrengthResult, PasswordRequirement } from '../../lib/passwordValidation'

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrengthResult
  requirements: PasswordRequirement[]
  showRequirements?: boolean
}

export function PasswordStrengthIndicator({
  strength,
  requirements,
  showRequirements = true
}: PasswordStrengthIndicatorProps) {
  const getStrengthColor = () => {
    switch (strength.strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStrengthTextColor = () => {
    switch (strength.strength) {
      case 'weak':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'strong':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStrengthPercentage = () => {
    switch (strength.strength) {
      case 'weak':
        return '33%'
      case 'medium':
        return '66%'
      case 'strong':
        return '100%'
      default:
        return '0%'
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password strength
          </span>
          <span className={`text-sm font-semibold capitalize ${getStrengthTextColor()}`}>
            {strength.strength}
          </span>
        </div>

        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: getStrengthPercentage() }}
          />
        </div>
      </div>

      {showRequirements && (
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
              <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
