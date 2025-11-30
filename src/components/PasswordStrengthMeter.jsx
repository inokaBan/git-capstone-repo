import React from 'react';
import { Check, X } from 'lucide-react';
import { calculatePasswordStrength } from '../utils/validation/passwordStrength';

const PasswordStrengthMeter = ({ password, showRequirements = true }) => {
  const strength = calculatePasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>

      {/* Requirements List */}
      {showRequirements && strength.feedback.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="text-gray-600 dark:text-gray-400 font-medium">Password must have:</p>
          <ul className="space-y-1">
            {/* Show met requirements */}
            {strength.checks.length && (
              <li className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                <span>At least 8 characters</span>
              </li>
            )}
            {strength.checks.uppercase && (
              <li className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                <span>One uppercase letter</span>
              </li>
            )}
            {strength.checks.lowercase && (
              <li className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                <span>One lowercase letter</span>
              </li>
            )}
            {strength.checks.number && (
              <li className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                <span>One number</span>
              </li>
            )}
            {strength.checks.special && (
              <li className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                <span>One special character</span>
              </li>
            )}
            
            {/* Show unmet requirements */}
            {strength.feedback.map((requirement, index) => (
              <li key={index} className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <X className="w-3 h-3" />
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
