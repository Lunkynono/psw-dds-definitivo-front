import { forwardRef, InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  requiredLabel?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, requiredLabel, required, className = '', ...props }, ref) {
  const isRequired = requiredLabel ?? Boolean(required);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label.replace(/\s\*$/, '')}
          {isRequired && <span className="ml-1 text-red-500" aria-label="obligatorio">*</span>}
        </label>
      )}
      <input
        ref={ref}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors ${
          error ? 'border-red-400 bg-red-50/40' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});
