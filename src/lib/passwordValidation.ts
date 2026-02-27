export interface PasswordStrengthResult {
  score: number
  strength: 'weak' | 'medium' | 'strong'
  feedback: string[]
}

export interface PasswordRequirement {
  label: string
  met: boolean
}

const COMMON_PASSWORDS = [
  'password', '123456', '123456789', '12345678', '12345', '1234567', '1234567890',
  'qwerty', 'abc123', 'password1', '111111', '123123', 'admin', 'letmein',
  'welcome', 'monkey', '1234', 'dragon', 'master', 'sunshine', 'princess',
  'football', 'iloveyou', 'admin123', 'welcome123', 'password123', '123321',
  'starwars', 'football1', 'trustno1', 'baseball', '1234qwer', 'superman',
  'pokemon', 'password1234', 'qwerty123', 'hello', 'welcome1', 'michael',
  'shadow', 'ashley', 'bailey', 'passw0rd', 'master123', 'jordan', 'charlie',
  'password12', 'abc12345', 'login', 'hello123', 'freedom', 'whatever',
  'nicole', 'soccer', 'jesus', 'summer', 'hunter', 'harley', 'ranger',
  'buster', 'thomas', 'tigger', 'robert', 'pepper', 'access', 'batman',
  'golfer', 'hockey', 'killer', 'george', 'computer', 'qazwsx', 'andrew',
  'orange', 'cookie', 'test', 'knight', 'maggie', 'chicken', 'pepper1',
  'michelle', 'coffee', 'music', 'taylor', 'hannah', 'summer1', 'tigger1',
  'silver', 'cheese', 'daniel', 'soccer1', 'london', 'yankees', 'ginger',
  'matrix', 'golfer1', 'lakers', 'winter', 'chocolate', 'secret', 'diamond',
  'purple', 'snoopy', 'thunder', 'cowboy', 'phoenix', 'rainbow', 'yankee',
  'jackson', 'gandalf', 'cameron', 'dallas', 'chicken1', 'phoenix1'
]

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase()
  return COMMON_PASSWORDS.includes(lowerPassword)
}

export function checkPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      label: 'Contains number',
      met: /\d/.test(password)
    },
    {
      label: 'Contains special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  ]
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  if (password.length === 0) {
    return {
      score: 0,
      strength: 'weak',
      feedback: ['Password is required']
    }
  }

  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters')
  } else if (password.length >= 8 && password.length < 12) {
    score += 1
  } else if (password.length >= 12) {
    score += 2
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }

  if (isCommonPassword(password)) {
    score = Math.max(0, score - 3)
    feedback.push('This password is too common')
  }

  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid repeated characters')
  }

  if (/^(?:123|abc|qwe)/i.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid sequential patterns')
  }

  let strength: 'weak' | 'medium' | 'strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 4) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  if (feedback.length === 0 && strength === 'strong') {
    feedback.push('Strong password!')
  }

  return {
    score,
    strength,
    feedback
  }
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0
}
