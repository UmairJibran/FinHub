/**
 * Example component demonstrating the position management system
 * This shows how to integrate all the position management components
 */

import { useState } from 'react';
import { usePortfolioPositions } from '../hooks/usePositions';
import { PositionList } from '../components/PositionList';
import { PositionForm } from '../components/PositionForm';
import { DeletePositionDialog } from '../components/DeletePositionDialog';
import type { PositionWithMetrics, CreatePositionInput, UpdatePositionInput } from '../lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface PositionManagementExampleProps {
  portfolioId: string;
  portfolioName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PositionManagementExample({
  portfolioId,
  portfolioName = 'Example Portfolio'
}: PositionManagementExampleProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithMetrics | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<PositionWithMetrics | null>(null);

  const {
    positions,
    isLoading,
    error,
    createPosition,
    updatePosition,
    deletePosition,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
    deleteError,
  } = usePortfolioPositions(portfolioId);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleAddPosition = () => {
    setEditingPosition(null);
    setIsFormOpen(true);
  };

  const handleEditPosition = (position: PositionWithMetrics) => {
    setEditingPosition(position);
    setIsFormOpen(true);
  };

  const handleDeletePosition = (position: PositionWithMetrics) => {
    setDeletingPosition(position);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreatePositionInput | UpdatePositionInput) => {
    try {
      if (editingPosition) {
        // Update existing position
        await updatePosition({
          id: editingPosition.id,
          input: data as UpdatePositionInput,
        });
      } else {
        // Create new position
        await createPosition(data as CreatePositionInput);
      }
      setIsFormOpen(false);
      setEditingPosition(null);
    } catch (error) {
      console.error('Error submitting position form:', error);
      // Error is handled by the hook and displayed in the form
    }
  };

  const handleDeleteConfirm = async (positionId: string) => {
    try {
      await deletePosition(positionId);
      setIsDeleteDialogOpen(false);
      setDeletingPosition(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      // Error is handled by the hook
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPosition(null);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPosition(null);
  };

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <h3 className="text-lg font-semibold mb-2">Error Loading Positions</h3>
          <p>{error.message}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {(createError || updateError || deleteError) && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
            Operation Failed
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300">
            {createError?.message || updateError?.message || deleteError?.message}
          </p>
        </div>
      )}

      {/* Position List */}
      <PositionList
        positions={positions}
        isLoading={isLoading}
        onAddPosition={handleAddPosition}
        onEditPosition={handleEditPosition}
        onDeletePosition={handleDeletePosition}
        portfolioName={portfolioName}
      />

      {/* Position Form Dialog */}
      <PositionForm
        portfolioId={portfolioId}
        position={editingPosition || undefined}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePositionDialog
        position={deletingPosition}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default PositionManagementExample;

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// Example usage in a portfolio detail page:

import { PositionManagementExample } from '../modules/portfolio-tracker/examples/PositionManagementExample';

function PortfolioDetailPage() {
  const { portfolioId } = useParams();
  const { data: portfolio } = usePortfolio(portfolioId);

  if (!portfolio) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{portfolio.name}</h1>
      
      <PositionManagementExample
        portfolioId={portfolio.id}
        portfolioName={portfolio.name}
      />
    </div>
  );
}
*/