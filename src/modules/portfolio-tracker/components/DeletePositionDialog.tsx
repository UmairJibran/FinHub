/**
 * Delete position confirmation dialog with transaction history preservation
 */

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { PositionWithMetrics } from '../lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface DeletePositionDialogProps {
  position: PositionWithMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (positionId: string) => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeletePositionDialog({
  position,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: DeletePositionDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  
  if (!position) return null;

  const isConfirmationValid = confirmationText.toLowerCase() === position.symbol.toLowerCase();

  const handleConfirm = () => {
    if (isConfirmationValid && !isLoading) {
      onConfirm(position.id);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Position
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the position
            from your portfolio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{position.symbol}</Badge>
              <h4 className="font-medium">{position.name}</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantity:</span>
                <div className="font-medium">
                  {position.quantity.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                  })}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Avg Cost:</span>
                <div className="font-medium">{formatCurrency(position.average_cost)}</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Total Invested:</span>
                <div className="font-medium">{formatCurrency(position.total_invested)}</div>
              </div>
              
              {position.current_value && (
                <div>
                  <span className="text-muted-foreground">Current Value:</span>
                  <div className="font-medium">{formatCurrency(position.current_value)}</div>
                </div>
              )}
            </div>

            {position.unrealized_gain_loss !== undefined && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unrealized Gain/Loss:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      position.unrealized_gain_loss >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(position.unrealized_gain_loss)}
                    </span>
                    {position.unrealized_gain_loss_percentage !== undefined && (
                      <Badge 
                        variant={position.unrealized_gain_loss >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {position.unrealized_gain_loss >= 0 ? '+' : ''}
                        {position.unrealized_gain_loss_percentage.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start gap-2">
              <History className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Transaction history for this position will be preserved 
                for audit purposes, but the position will be removed from your portfolio.
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{position.symbol}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={position.symbol}
              disabled={isLoading}
              className={
                confirmationText && !isConfirmationValid 
                  ? 'border-red-300 focus:border-red-500' 
                  : ''
              }
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Symbol doesn't match. Please type exactly: {position.symbol}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Position
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeletePositionDialog;