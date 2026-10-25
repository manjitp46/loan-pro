import React, { useState, useEffect } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  allowEmpty?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0',
  step = 'any',
  min,
  max,
  ...rest
}) => {
  const [localVal, setLocalVal] = useState<string>(() => (value === 0 ? '' : String(value)));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Sync external changes (e.g. from sliders or presets) when not actively typing
  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value === 0 ? '' : String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);

    if (raw === '' || raw === '-') {
      onChange(0);
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (localVal === '' || isNaN(parseFloat(localVal))) {
      setLocalVal('');
      onChange(0);
    } else {
      const num = parseFloat(localVal);
      setLocalVal(num === 0 ? '' : String(num));
      onChange(num);
    }
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (rest.onFocus) {
      rest.onFocus(e);
    }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};
