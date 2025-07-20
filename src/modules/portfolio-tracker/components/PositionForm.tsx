/**
 * Position form component for adding and editing positions
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Loader2, Plus, Edit3 } from 'lucide-react';
import { CreatePositionSchema, UpdatePositionSchema } from '../lib/schemas';
import type { Position, CreatePositionInput, UpdatePositionInput } from '../lib/types';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface PositionFormProps {
  portfolioId: string;
  position?: Position;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePositionInput | UpdatePositionInput) => Promise<void>;
  isLoading?: boolean;
}

type FormData = z.infer<typeof CreatePositionSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export function PositionForm({
  portfolioId,
  position,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: PositionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!position;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(isEditing ? UpdatePositionSchema : CreatePositionSchema),
    defaultValues: {
      portfolio_id: portfolioId,
      symbol: '',
      name: '',
      quantity: 0,
      purchase_price: 0,
      current_price: undefined,
    },
  });

  // Watch quantity and price for total calculation
  const quantity = watch('quantity');
  const purchasePrice = watch('purchase_price');
  const totalInvestment = quantity && purchasePrice ? quantity * purchasePrice : 0;

  // Reset form when position changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && position) {
        setValue('portfolio_id', position.portfolio_id);
        setValue('symbol', position.symbol);
        setValue('name', position.name);
        setValue('quantity', position.quantity);
        setValue('purchase_price', position.average_cost);
        setValue('current_price', position.current_price || undefined);
      } else {
        reset({
          portfolio_id: portfolioId,
          symbol: '',
          name: '',
          quantity: 0,
          purchase_price: 0,
          current_price: undefined,
        });
      }
    }
  }, [isOpen, isEditing, position, portfolioId, setValue, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // For updates, only send changed fields
        const updateData: UpdatePositionInput = {};
        
        if (data.symbol !== position?.symbol) {
          updateData.symbol = data.symbol;
        }
        if (data.name !== position?.name) {
          updateData.name = data.name;
        }
        if (data.quantity !== position?.quantity) {
          updateData.quantity = data.quantity;
          updateData.purchase_price = data.purchase_price;
        }

        await onSubmit(updateData);
      } else {
        // For creation, send all data
        const createData: CreatePositionInput = {
          portfolio_id: data.portfolio_id,
          symbol: data.symbol,
          name: data.name,
          quantity: data.quantity,
          purchase_price: data.purchase_price,
          current_price: data.current_price,
        };

        await onSubmit(createData);
      }

      onClose();
    } catch (error) {
      console.error('Error submitting position form:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="h-5 w-5" />
                Edit Position
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add New Position
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Symbol */}
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL, BTC"
                {...register('symbol')}
                disabled={isSubmitting || isLoading}
                className={errors.symbol ? 'border-red-500' : ''}
              />
              {errors.symbol && (
                <p className="text-sm text-red-500">{errors.symbol.message}</p>
              )}
            </div>

            {/* Current Price */}
            <div className="space-y-2">
              <Label htmlFor="current_price">Current Price</Label>
              <Input
                id="current_price"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00"
                {...register('current_price', { valueAsNumber: true })}
                disabled={isSubmitting || isLoading}
                className={errors.current_price ? 'border-red-500' : ''}
              />
              {errors.current_price && (
                <p className="text-sm text-red-500">{errors.current_price.message}</p>
              )}
            </div>
          </div>

          {/* Asset Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Apple Inc., Bitcoin"
              {...register('name')}
              disabled={isSubmitting || isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
                disabled={isSubmitting || isLoading}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="purchase_price">
                {isEditing ? 'New Purchase Price *' : 'Purchase Price *'}
              </Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00"
                {...register('purchase_price', { valueAsNumber: true })}
                disabled={isSubmitting || isLoading}
                className={errors.purchase_price ? 'border-red-500' : ''}
              />
              {errors.purchase_price && (
                <p className="text-sm text-red-500">{errors.purchase_price.message}</p>
              )}
            </div>
          </div>

          {/* Investment Summary */}
          {totalInvestment > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {isEditing ? 'Additional Investment:' : 'Total Investment:'}
                  </span>
                  <span className="text-lg font-semibold">
                    ${totalInvestment.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {isEditing && position && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Current Total Invested:</span>
                      <span>
                        ${position.total_invested.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !isDirty}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Position' : 'Add Position'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PositionForm;