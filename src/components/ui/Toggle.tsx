import { LucideIcon } from 'lucide-react';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  enabledIcon?: LucideIcon;
  disabledIcon?: LucideIcon;
}

export function Toggle({ enabled, onChange, enabledIcon: EnabledIcon, disabledIcon: DisabledIcon }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
      }`}
      type="button"
    >
      <span
        className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      >
        {enabled && EnabledIcon && <EnabledIcon className="w-3 h-3 text-emerald-600" />}
        {!enabled && DisabledIcon && <DisabledIcon className="w-3 h-3 text-gray-600" />}
      </span>
    </button>
  );
}
