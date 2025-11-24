// Common weak passwords to check against
const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football'
];

/**
 * Calculate password strength based on multiple criteria
 * @param {string} password - The password to evaluate
 * @returns {Object} Object containing score, label, percentage, color, textColor, feedback, and checks
 */
export const calculatePasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: 'None',
      percentage: 0,
      color: 'bg-gray-300',
      textColor: 'text-gray-600',
      feedback: []
    };
  }

  let score = 0;
  const feedback = [];
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())
  };

  // Check each requirement
  if (checks.length) {
    score += 20;
  } else {
    feedback.push('At least 8 characters');
  }

  if (checks.uppercase) {
    score += 15;
  } else {
    feedback.push('One uppercase letter');
  }

  if (checks.lowercase) {
    score += 15;
  } else {
    feedback.push('One lowercase letter');
  }

  if (checks.number) {
    score += 15;
  } else {
    feedback.push('One number');
  }

  if (checks.special) {
    score += 20;
  } else {
    feedback.push('One special character (!@#$%^&*...)');
  }

  if (checks.notCommon) {
    score += 15;
  } else {
    feedback.push('Avoid common passwords');
  }

  // Determine strength label and styling
  let label, color, textColor;
  if (score < 40) {
    label = 'Weak';
    color = 'bg-red-500';
    textColor = 'text-red-600';
  } else if (score < 60) {
    label = 'Fair';
    color = 'bg-orange-500';
    textColor = 'text-orange-600';
  } else if (score < 85) {
    label = 'Good';
    color = 'bg-yellow-500';
    textColor = 'text-yellow-600';
  } else {
    label = 'Strong';
    color = 'bg-green-500';
    textColor = 'text-green-600';
  }

  return {
    score,
    label,
    percentage: score,
    color,
    textColor,
    feedback,
    checks
  };
};

/**
 * Validate if password meets minimum strength requirements
 * @param {string} password - The password to validate
 * @returns {Object} Object containing isValid, message, and strength details
 */
export const validatePasswordStrength = (password) => {
  const strength = calculatePasswordStrength(password);
  
  // Require at least "Good" strength (score >= 60)
  if (strength.score < 60) {
    return {
      isValid: false,
      message: 'Password is too weak. Please meet the requirements below.',
      strength
    };
  }

  return {
    isValid: true,
    message: '',
    strength
  };
};

// Export as default object for convenience
const PasswordStrength = {
  calculatePasswordStrength,
  validatePasswordStrength,
  COMMON_WEAK_PASSWORDS
};

export default PasswordStrength;
