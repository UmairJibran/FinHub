'use client';

import type { FC } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencySelector } from '@/modules/sip-swp/components/steps/currency-selector';
import { SupportedCurrency } from '@/modules/sip-swp/lib/types';

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  PKR: '₨',
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

type FormValues = {
  currency: SupportedCurrency;
  currentInvestment: number;
  currentShares: number;
  currentPrice: number;
  targetAvg: number;
};

export const ShareAveragingCalculator: FC = () => {
  const methods = useForm<FormValues>({
    defaultValues: {
      currency: 'PKR',
      currentInvestment: 0,
      currentShares: 0,
      currentPrice: 0,
      targetAvg: 0,
    },
    mode: 'onChange',
  });

  const values = useWatch({ control: methods.control });
  const currency = values?.currency || 'PKR';
  let error = '';
  let result: null | {
    newShares: number;
    newInvestment: number;
    totalShares: number;
    newAverage: number;
  } = null;

  const { currentInvestment, currentShares, currentPrice, targetAvg } =
    values || {};

  if (
    typeof currentInvestment === 'number' &&
    typeof currentShares === 'number' &&
    typeof currentPrice === 'number' &&
    typeof targetAvg === 'number' &&
    currentInvestment > 0 &&
    currentShares > 0 &&
    currentPrice > 0 &&
    targetAvg > 0
  ) {
    const numerator = currentInvestment - currentShares * targetAvg;
    const denominator = targetAvg - currentPrice;
    if (denominator <= 0) {
      error = 'Target average must be higher than current price.';
    } else {
      const newShares = numerator / denominator;
      if (newShares < 0) {
        error = 'Target average is already achieved or not possible.';
      } else {
        const newInvestment = newShares * currentPrice;
        const totalShares = currentShares + newShares;
        const newAverage = (currentInvestment + newInvestment) / totalShares;
        result = { newShares, newInvestment, totalShares, newAverage };
      }
    }
  }

  return (
    <FormProvider {...methods}>
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Share Averaging Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <CurrencySelector
              onSelect={(c) => methods.setValue('currency', c)}
            />
          </div>
          <form className="space-y-4">
            <div>
              <Label htmlFor="currentInvestment">
                Current Total Investment ({CURRENCY_SYMBOLS[currency]})
              </Label>
              <Input
                id="currentInvestment"
                type="number"
                step="any"
                {...methods.register('currentInvestment', {
                  valueAsNumber: true,
                })}
                min={0}
                placeholder={`e.g. 100000`}
              />
            </div>
            <div>
              <Label htmlFor="currentShares">Current Number of Shares</Label>
              <Input
                id="currentShares"
                type="number"
                step="1"
                {...methods.register('currentShares', { valueAsNumber: true })}
                min={1}
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <Label htmlFor="currentPrice">
                Today&apos;s Market Price ({CURRENCY_SYMBOLS[currency]})
              </Label>
              <Input
                id="currentPrice"
                type="number"
                step="any"
                {...methods.register('currentPrice', { valueAsNumber: true })}
                min={0.01}
                placeholder={`e.g. 120`}
              />
            </div>
            <div>
              <Label htmlFor="targetAvg">
                Target Average Price ({CURRENCY_SYMBOLS[currency]})
              </Label>
              <Input
                id="targetAvg"
                type="number"
                step="any"
                {...methods.register('targetAvg', { valueAsNumber: true })}
                min={0.01}
                placeholder={`e.g. 110`}
              />
            </div>
          </form>
          <div className="mt-6 min-h-[80px]">
            {error && <div className="text-red-500 font-semibold">{error}</div>}
            {result && !error && (
              <div className="space-y-2">
                <div>
                  <strong>You should buy:</strong> {Math.ceil(result.newShares)}{' '}
                  shares at {CURRENCY_SYMBOLS[currency]}{' '}
                  {Number(currentPrice).toFixed(2)}
                </div>
                <div>
                  <strong>Additional investment:</strong>{' '}
                  {CURRENCY_SYMBOLS[currency]} {result.newInvestment.toFixed(2)}
                </div>
                <div>
                  <strong>New average price:</strong>{' '}
                  {CURRENCY_SYMBOLS[currency]} {result.newAverage.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </FormProvider>
  );
};
