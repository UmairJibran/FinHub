/**
 * Form components with real-time validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateField, createDebouncedValidator, type FieldValidationResult } from '@/lib/validation';
import { z } from 'zod';

// Base validated field props
interface BaseValidatedFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  helpText?: string;
  showValidationIcon?: boolean;
}

// Validated Input Component
interface ValidatedInputProps extends BaseValidatedFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (result: FieldValidationResult) => void;
  schema?: z.ZodSchema<any>;
  asyncValidator?: (value: string) => Promise<FieldValidationResult>;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  debounceMs?: number;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  onValidation,
  schema,
  asyncValidator,
  error: externalError,
  required = false,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  helpText,
  showValidationIcon = true,
  debounceMs = 300,
}: ValidatedInputProps) {
  const [internalError, setInternalError] = useState<string>();
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const [touched, setTouched] = useState(false);

  // Create debounced validator
  const debouncedValidator = useCallback(
    createDebouncedValidator(async (val: string) => {
      if (!schema && !asyncValidator) {
        return { isValid: true };
      }

      // Schema validation first
      if (schema) {
        const result = validateField(schema, val);
        if (!result.isValid) {
          return result;
        }
      }

      // Async validation second
      if (asyncValidator) {
        return await asyncValidator(val);
      }

      return { isValid: true };
    }, debounceMs),
    [schema, asyncValidator, debounceMs]
  );

  // Validate on value change
  useEffect(() => {
    if (!touched || (!schema && !asyncValidator)) return;

    setIsValidating(true);
    debouncedValidator(value).then((result) => {
      setInternalError(result.error);
      setIsValid(result.isValid);
      setIsValidating(false);
      onValidation?.(result);
    });
  }, [value, touched, schema, asyncValidator, debouncedValidator, onValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (!touched) setTouched(true);
  };

  const handleBlur = () => {
    if (!touched) setTouched(true);
  };

  const displayError = externalError || internalError;
  const showError = touched && displayError;
  const showSuccess = touched && !displayError && isValid && !isValidating;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={label} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id={label}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            showError && 'border-destructive focus-visible:ring-destructive',
            showSuccess && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        
        {showValidationIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {showError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {showSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>

      {helpText && !showError && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {showError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Validated Textarea Component
interface ValidatedTextareaProps extends BaseValidatedFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (result: FieldValidationResult) => void;
  schema?: z.ZodSchema<any>;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function ValidatedTextarea({
  label,
  value,
  onChange,
  onValidation,
  schema,
  error: externalError,
  required = false,
  placeholder,
  disabled = false,
  rows = 3,
  className,
  helpText,
  showValidationIcon = true,
}: ValidatedTextareaProps) {
  const [internalError, setInternalError] = useState<string>();
  const [isValid, setIsValid] = useState<boolean>();
  const [touched, setTouched] = useState(false);

  // Validate on value change
  useEffect(() => {
    if (!touched || !schema) return;

    const result = validateField(schema, value);
    setInternalError(result.error);
    setIsValid(result.isValid);
    onValidation?.(result);
  }, [value, touched, schema, onValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (!touched) setTouched(true);
  };

  const handleBlur = () => {
    if (!touched) setTouched(true);
  };

  const displayError = externalError || internalError;
  const showError = touched && displayError;
  const showSuccess = touched && !displayError && isValid;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={label} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Textarea
          id={label}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(
            showError && 'border-destructive focus-visible:ring-destructive',
            showSuccess && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        
        {showValidationIcon && (
          <div className="absolute right-3 top-3">
            {showError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {showSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>

      {helpText && !showError && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {showError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Validated Select Component
interface ValidatedSelectProps extends BaseValidatedFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (result: FieldValidationResult) => void;
  schema?: z.ZodSchema<any>;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
}

export function ValidatedSelect({
  label,
  value,
  onChange,
  onValidation,
  schema,
  options,
  error: externalError,
  required = false,
  placeholder = 'Select an option',
  disabled = false,
  className,
  helpText,
  showValidationIcon = true,
}: ValidatedSelectProps) {
  const [internalError, setInternalError] = useState<string>();
  const [isValid, setIsValid] = useState<boolean>();
  const [touched, setTouched] = useState(false);

  // Validate on value change
  useEffect(() => {
    if (!touched || !schema) return;

    const result = validateField(schema, value);
    setInternalError(result.error);
    setIsValid(result.isValid);
    onValidation?.(result);
  }, [value, touched, schema, onValidation]);

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    if (!touched) setTouched(true);
  };

  const displayError = externalError || internalError;
  const showError = touched && displayError;
  const showSuccess = touched && !displayError && isValid;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Select
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              showError && 'border-destructive focus:ring-destructive',
              showSuccess && 'border-green-500 focus:ring-green-500'
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {showValidationIcon && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            {showError && <AlertCircle className="h-4 w-4 text-destructive" />}
            {showSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>

      {helpText && !showError && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {showError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Form validation summary
interface FormValidationSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export function FormValidationSummary({ errors, className }: FormValidationSummaryProps) {
  const errorList = Object.entries(errors).filter(([_, error]) => error);
  
  if (errorList.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn('mb-4', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-2">Please fix the following errors:</div>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {errorList.map(([field, error]) => (
            <li key={field}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}