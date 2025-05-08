'use client';

import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as z from 'zod';
import type { FC } from 'react';

const formSchema = z.object({
  currentInvestment: z.coerce.number().min(0, 'Required'),
  currentShares: z.coerce.number().min(1, 'Required'),
  currentPrice: z.coerce.number().min(0.01, 'Required'),
  targetAvg: z.coerce.number().min(0.01, 'Required'),
});

type FormValues = z.infer<typeof formSchema>;

export const ShareAveragingCalculator: FC = () => {
  const methods = useForm<FormValues>({
    defaultValues: {
      currentInvestment: 0,
      currentShares: 0,
      currentPrice: 0,
      targetAvg: 0,
    },
    mode: 'onChange',
  });

  const values = useWatch({ control: methods.control });
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
          <form className="space-y-4">
            <div>
              <Label htmlFor="currentInvestment">
                Current Total Investment (PKR)
              </Label>
              <Input
                id="currentInvestment"
                type="number"
                step="any"
                {...methods.register('currentInvestment', {
                  valueAsNumber: true,
                })}
                min={0}
                placeholder="e.g. 100000"
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
              <Label htmlFor="currentPrice">Today's Market Price (PKR)</Label>
              <Input
                id="currentPrice"
                type="number"
                step="any"
                {...methods.register('currentPrice', { valueAsNumber: true })}
                min={0.01}
                placeholder="e.g. 120"
              />
            </div>
            <div>
              <Label htmlFor="targetAvg">Target Average Price (PKR)</Label>
              <Input
                id="targetAvg"
                type="number"
                step="any"
                {...methods.register('targetAvg', { valueAsNumber: true })}
                min={0.01}
                placeholder="e.g. 110"
              />
            </div>
          </form>
          <div className="mt-6 min-h-[80px]">
            {error && <div className="text-red-500 font-semibold">{error}</div>}
            {result && !error && (
              <div className="space-y-2">
                <div>
                  <strong>You should buy:</strong> {Math.ceil(result.newShares)}{' '}
                  shares at PKR {Number(currentPrice).toFixed(2)}
                </div>
                <div>
                  <strong>Additional investment:</strong> PKR{' '}
                  {result.newInvestment.toFixed(2)}
                </div>
                <div>
                  <strong>New average price:</strong> PKR{' '}
                  {result.newAverage.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </FormProvider>
  );
};
