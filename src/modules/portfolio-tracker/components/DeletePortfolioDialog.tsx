/**
 * Delete portfolio confirmation dialog
 */

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
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
import type { PortfolioSummary } from '../lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface DeletePortfolioDialogProps {
  portfolio: PortfolioSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (portfolioId: string) => void;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeletePortfolioDialog({
  portfolio,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: DeletePortfolioDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  
  if (!portfolio) return null;

  const isConfirmationValid = confirmationText.toLowerCase() === portfolio.name.toLowerCase();
  const hasPositions = portfolio.total_positions > 0;

  const handleConfirm = () => {
    if (isConfirmationValid && !isLoading) {
      onConfirm(portfolio.id);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Portfolio
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the portfolio
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Portfolio Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">{portfolio.name}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Positions: {portfolio.total_positions}</div>
              <div>Total Invested: ${portfolio.total_invested.toLocaleString()}</div>
              {portfolio.current_value && (
                <div>Current Value: ${portfolio.current_value.toLocaleString()}</div>
              )}
            </div>
          </div>

          {/* Warning for portfolios with positions */}
          {hasPositions && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> This portfolio contains {portfolio.total_positions} 
                  {portfolio.total_positions === 1 ? ' position' : ' positions'}. 
                  All positions and their transaction history will be permanently deleted.
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>{portfolio.name}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={portfolio.name}
              disabled={isLoading}
              className={
                confirmationText && !isConfirmationValid 
                  ? 'border-red-300 focus:border-red-500' 
                  : ''
              }
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Portfolio name doesn't match. Please type exactly: {portfolio.name}
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
                Delete Portfolio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}