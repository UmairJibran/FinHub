import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/currency-config';
import { Loader2, Edit, DollarSign, TrendingUp } from 'lucide-react';
import type { AssetPrice, PositionWithPrice } from '@/lib/supabase/types';

// Form validation schema
const priceUpdateSchema = z.object({
  currentPrice: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Price must be a positive number',
    }),
});

type PriceUpdateFormData = z.infer<typeof priceUpdateSchema>;

interface UserAsset {
  symbol: string;
  name: string;
  currency: string;
  currentPrice: number | null;
  lastUpdated: string | null;
  totalQuantity: number;
  portfolioCount: number;
}

export default function AssetPrices() {
  const { user, profile, refreshUser } = useAuth();
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PriceUpdateFormData>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      currentPrice: '',
    },
  });

  // Load user's assets and refresh user data
  useEffect(() => {
    if (user) {
      // Refresh user data to ensure we have the latest currency preferences
      refreshUser();
      loadUserAssets();
    }
  }, [user, refreshUser]);

  const loadUserAssets = async () => {
    if (!supabase || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // First get user's portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id, currency')
        .eq('user_id', user.id);

      if (portfoliosError) {
        throw portfoliosError;
      }

      const portfolioIds = portfolios?.map(p => p.id) || [];
      
      if (portfolioIds.length === 0) {
        setUserAssets([]);
        return;
      }

      // Get all positions for the user with their current prices
      const { data: positions, error: positionsError } = await supabase
        .from('positions_with_prices')
        .select('*')
        .in('portfolio_id', portfolioIds);

      if (positionsError) {
        throw positionsError;
      }

      // Group positions by symbol and aggregate data
      const assetMap = new Map<string, UserAsset>();

      positions?.forEach((position: PositionWithPrice) => {
        // Get currency from portfolio or default to USD
        const portfolio = portfolios?.find(p => p.id === position.portfolio_id);
        const currency = portfolio?.currency || 'USD';
        const key = `${position.symbol}-${currency}`;
        
        if (assetMap.has(key)) {
          const existing = assetMap.get(key)!;
          existing.totalQuantity += position.quantity;
          existing.portfolioCount += 1;
        } else {
          assetMap.set(key, {
            symbol: position.symbol,
            name: position.name,
            currency: currency,
            currentPrice: position.market_price,
            lastUpdated: position.price_last_updated,
            totalQuantity: position.quantity,
            portfolioCount: 1,
          });
        }
      });

      setUserAssets(Array.from(assetMap.values()));
    } catch (err) {
      setError('Failed to load your assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = (asset: UserAsset) => {
    setSelectedAsset(asset);
    form.reset({
      currentPrice: asset.currentPrice?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PriceUpdateFormData) => {
    if (!selectedAsset || !supabase) return;

    setIsUpdating(true);
    setError(null);

    try {
      const price = Number(data.currentPrice);

      // Upsert the asset price
      const { error: upsertError } = await supabase
        .from('asset_prices')
        .upsert({
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          current_price: price,
          currency: selectedAsset.currency,
        }, {
          onConflict: 'symbol,currency'
        });

      if (upsertError) {
        throw upsertError;
      }

      // Reload assets to show updated prices
      await loadUserAssets();
      setIsDialogOpen(false);
      setSelectedAsset(null);
    } catch (err) {
      setError('Failed to update asset price');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to manage asset prices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Asset Prices
          </h1>
          <p className="text-muted-foreground dark:text-slate-300 mt-2">
            Update current prices for your assets. These prices will be reflected across all portfolios.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Your Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userAssets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground dark:text-slate-300">
                  No assets found. Add some positions to your portfolios to see them here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Portfolios</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAssets.map((asset) => (
                      <TableRow key={`${asset.symbol}-${asset.currency}`}>
                        <TableCell className="font-medium">{asset.symbol}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.currency}</TableCell>
                        <TableCell>
                          {asset.currentPrice 
                            ? formatCurrency(asset.currentPrice, asset.currency)
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          {asset.lastUpdated 
                            ? new Date(asset.lastUpdated).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>{asset.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell>{asset.portfolioCount}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdatePrice(asset)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Price Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Update Price for {selectedAsset?.symbol}
              </DialogTitle>
            </DialogHeader>
            
            {selectedAsset && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground dark:text-slate-300">
                      <strong className="dark:text-white">Asset:</strong> {selectedAsset.name} ({selectedAsset.symbol})
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-slate-300">
                      <strong className="dark:text-white">Currency:</strong> {selectedAsset.currency}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-slate-300">
                      <strong className="dark:text-white">Current Price:</strong> {
                        selectedAsset.currentPrice 
                          ? formatCurrency(selectedAsset.currentPrice, selectedAsset.currency)
                          : 'Not set'
                      }
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-200">New Price ({selectedAsset.currency})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter new price"
                            disabled={isUpdating}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Price'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}