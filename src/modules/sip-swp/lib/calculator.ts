import { CalculatorInputs, CalculationResults } from "./types";

export function calculateSIPSWP(inputs: CalculatorInputs): CalculationResults {
    const {
        initialInvestment,
        monthlyContribution,
        annualInterestRate = 0,
        swpStartYear,
        monthlyWithdrawal,
        projectionYears,
        swpAnnualIncrease,
        sipAnnualIncrease,
        currency
    } = inputs;

    // Validate inputs to prevent NaN
    if (!monthlyContribution || !swpStartYear || !monthlyWithdrawal || !projectionYears) {
        throw new Error("Missing required inputs");
    }

    const monthlyReturn = Math.pow(1 + (annualInterestRate / 100), 1 / 12) - 1;
    const results: CalculationResults = [];

    let currentBalance = initialInvestment || 0;
    let currentWithdrawal = monthlyWithdrawal;
    let currentContribution = monthlyContribution;
    let lastYear = 0;

    try {
        for (let year = 1; year <= projectionYears; year++) {
            lastYear = year;

            // Increase amounts at the start of each year (after first year)
            if (year > 1) {
                if (year <= swpStartYear) {
                    // During SIP phase, increase contribution
                    currentContribution = Number((currentContribution * (1 + (sipAnnualIncrease / 100))).toFixed(2));
                } else {
                    // During SWP phase, increase withdrawal
                    currentWithdrawal = Number((currentWithdrawal * (1 + (swpAnnualIncrease / 100))).toFixed(2));
                }
            }

            for (let month = 1; month <= 12; month++) {
                // Apply monthly flow (contribution or withdrawal)
                if (year < swpStartYear) {
                    currentBalance += currentContribution;
                } else {
                    currentBalance -= currentWithdrawal;
                }

                // Apply monthly returns
                currentBalance = Number((currentBalance * (1 + monthlyReturn)).toFixed(2));

                // Check for depletion
                if (currentBalance <= 0) {
                    currentBalance = 0;
                    break;
                }

                // Format values for display
                const formattedTotal = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(currentBalance);

                const currentFlow = year < swpStartYear ? currentContribution : currentWithdrawal;
                const formattedContribution = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(currentFlow);

                results.push({
                    year,
                    month,
                    total: formattedTotal,
                    contribution: formattedContribution
                });
            }

            if (currentBalance <= 0) {
                break;
            }
        }

        return results;
    } catch (error) {
        throw error;
    }
} 