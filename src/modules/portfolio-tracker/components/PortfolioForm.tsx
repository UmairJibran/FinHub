/**
 * Portfolio form component for creating and editing portfolios
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { PortfolioFormSchema } from '../lib/schemas';
import { AssetType, AssetTypeLabels } from '../lib/types';
import type { Portfolio, PortfolioFormData } from '../lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioFormProps {
  portfolio?: Portfolio;
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PortfolioForm({
  portfolio,
  onSubmit,
  onCancel,
  isLoading = false,
  error
}: PortfolioFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!portfolio;

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(PortfolioFormSchema),
    defaultValues: {
      name: portfolio?.name || '',
      description: portfolio?.description || '',
      asset_type: portfolio?.asset_type || AssetType.STOCKS,
    },
  });

  // Reset form when portfolio changes
  useEffect(() => {
    if (portfolio) {
      form.reset({
        name: portfolio.name,
        description: portfolio.description || '',
        asset_type: portfolio.asset_type,
      });
    }
  }, [portfolio, form]);

  const handleSubmit = async (data: PortfolioFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (err) {
      // Error handling is done by parent component
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {isEditing ? 'Edit Portfolio' : 'Create New Portfolio'}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isFormLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Portfolio Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Growth Portfolio, Dividend Stocks"
                      disabled={isFormLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Asset Type */}
            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isFormLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssetType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {AssetTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of your portfolio strategy or goals"
                      className="min-h-[100px]"
                      disabled={isFormLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isFormLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isFormLoading}
                className="flex-1"
              >
                {isFormLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Portfolio' : 'Create Portfolio'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ASSET TYPE SELECTOR COMPONENT
// ============================================================================

interface AssetTypeSelectorProps {
  value: AssetType;
  onChange: (value: AssetType) => void;
  disabled?: boolean;
}

export function AssetTypeSelector({ 
  value, 
  onChange, 
  disabled = false 
}: AssetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Object.values(AssetType).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          disabled={disabled}
          className={`
            p-4 text-left border rounded-lg transition-all duration-200
            hover:border-primary hover:bg-primary/5
            disabled:opacity-50 disabled:cursor-not-allowed
            ${value === type 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border bg-background'
            }
          `}
        >
          <div className="font-medium">{AssetTypeLabels[type]}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {getAssetTypeDescription(type)}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAssetTypeDescription(type: AssetType): string {
  switch (type) {
    case AssetType.STOCKS:
      return 'Individual stocks and equity investments';
    case AssetType.CRYPTO:
      return 'Cryptocurrency and digital assets';
    case AssetType.MUTUAL_FUNDS:
      return 'Mutual funds and ETFs';
    case AssetType.COMMODITIES:
      return 'Gold, silver, oil, and other commodities';
    case AssetType.REAL_ESTATE:
      return 'REITs and real estate investments';
    default:
      return '';
  }
}