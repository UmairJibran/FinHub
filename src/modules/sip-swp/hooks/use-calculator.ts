import { useState } from "react";

import { calculateSIPSWP } from "../lib/calculator";
import { CalculatorInputs, CalculationResults } from "../lib/types";

export function useCalculator(): {
    isCalculating: boolean;
    results: CalculationResults | null;
    error: string | null;
    calculate: (values: CalculatorInputs) => Promise<void>;
} {
    const [isCalculating, setIsCalculating] = useState(false);
    const [results, setResults] = useState<CalculationResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const calculate = async (values: CalculatorInputs): Promise<void> => {
        setIsCalculating(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const results = calculateSIPSWP(values);
            setResults(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Calculation failed");
        } finally {
            setIsCalculating(false);
        }
    };

    return {
        isCalculating,
        results,
        error,
        calculate
    };
} 