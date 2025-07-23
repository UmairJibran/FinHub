/**
 * Row Level Security (RLS) testing utilities
 */

import { supabase, isSupabaseAvailable } from './supabase/client';
import { SecurityAuditLogger, SECURITY_EVENTS } from './security-config';

export interface RLSTestResult {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  success: boolean;
  error?: string;
  expectedBehavior: 'ALLOW' | 'DENY';
  actualBehavior: 'ALLOW' | 'DENY';
  passed: boolean;
}

export interface RLSTestSuite {
  name: string;
  results: RLSTestResult[];
  passed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// Test RLS policies for portfolios table
export async function testPortfolioRLS(): Promise<RLSTestSuite> {
  const results: RLSTestResult[] = [];
  
  if (!isSupabaseAvailable || !supabase) {
    return {
      name: 'Portfolio RLS Tests',
      results: [],
      passed: false,
      summary: { total: 0, passed: 0, failed: 1 },
    };
  }

  // Test 1: User can view their own portfolios
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .limit(1);
    
    results.push({
      table: 'portfolios',
      operation: 'SELECT',
      success: !error,
      error: error?.message,
      expectedBehavior: 'ALLOW',
      actualBehavior: error ? 'DENY' : 'ALLOW',
      passed: !error,
    });
  } catch (err) {
    results.push({
      table: 'portfolios',
      operation: 'SELECT',
      success: false,
      error: (err as Error).message,
      expectedBehavior: 'ALLOW',
      actualBehavior: 'DENY',
      passed: false,
    });
  }

  // Test 2: User can insert their own portfolios
  try {
    const testPortfolio = {
      name: 'RLS Test Portfolio',
      description: 'Test portfolio for RLS validation',
      asset_type: 'stocks' as const,
    };

    const { data, error } = await supabase
      .from('portfolios')
      .insert(testPortfolio)
      .select()
      .single();
    
    const insertResult = {
      table: 'portfolios',
      operation: 'INSERT' as const,
      success: !error,
      error: error?.message,
      expectedBehavior: 'ALLOW' as const,
      actualBehavior: error ? 'DENY' as const : 'ALLOW' as const,
      passed: !error,
    };
    
    results.push(insertResult);

    // Clean up test data if insert was successful
    if (data && !error) {
      await supabase
        .from('portfolios')
        .delete()
        .eq('id', data.id);
    }
  } catch (err) {
    results.push({
      table: 'portfolios',
      operation: 'INSERT',
      success: false,
      error: (err as Error).message,
      expectedBehavior: 'ALLOW',
      actualBehavior: 'DENY',
      passed: false,
    });
  }

  const passed = results.every(r => r.passed);
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
  };

  return {
    name: 'Portfolio RLS Tests',
    results,
    passed,
    summary,
  };
}

// Test RLS policies for positions table
export async function testPositionRLS(): Promise<RLSTestSuite> {
  const results: RLSTestResult[] = [];
  
  if (!isSupabaseAvailable || !supabase) {
    return {
      name: 'Position RLS Tests',
      results: [],
      passed: false,
      summary: { total: 0, passed: 0, failed: 1 },
    };
  }

  // First, create a test portfolio to use for position tests
  let testPortfolioId: string | null = null;
  
  try {
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        name: 'RLS Test Portfolio for Positions',
        description: 'Test portfolio for position RLS validation',
        asset_type: 'stocks',
      })
      .select()
      .single();

    if (portfolioError || !portfolio) {
      results.push({
        table: 'positions',
        operation: 'SELECT',
        success: false,
        error: 'Failed to create test portfolio for position tests',
        expectedBehavior: 'ALLOW',
        actualBehavior: 'DENY',
        passed: false,
      });
      
      return {
        name: 'Position RLS Tests',
        results,
        passed: false,
        summary: { total: 1, passed: 0, failed: 1 },
      };
    }

    testPortfolioId = portfolio.id;

    // Test 1: User can view positions in their own portfolio
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('portfolio_id', testPortfolioId)
      .limit(1);
    
    results.push({
      table: 'positions',
      operation: 'SELECT',
      success: !error,
      error: error?.message,
      expectedBehavior: 'ALLOW',
      actualBehavior: error ? 'DENY' : 'ALLOW',
      passed: !error,
    });

    // Test 2: User can insert positions in their own portfolio
    const testPosition = {
      portfolio_id: testPortfolioId,
      symbol: 'RLSTEST',
      name: 'RLS Test Stock',
      quantity: 100,
      average_cost: 10.50,
      total_invested: 1050.00,
    };

    const { data: positionData, error: insertError } = await supabase
      .from('positions')
      .insert(testPosition)
      .select()
      .single();
    
    results.push({
      table: 'positions',
      operation: 'INSERT',
      success: !insertError,
      error: insertError?.message,
      expectedBehavior: 'ALLOW',
      actualBehavior: insertError ? 'DENY' : 'ALLOW',
      passed: !insertError,
    });

    // Clean up test position if created
    if (positionData && !insertError) {
      await supabase
        .from('positions')
        .delete()
        .eq('id', positionData.id);
    }

  } catch (err) {
    results.push({
      table: 'positions',
      operation: 'SELECT',
      success: false,
      error: (err as Error).message,
      expectedBehavior: 'ALLOW',
      actualBehavior: 'DENY',
      passed: false,
    });
  } finally {
    // Clean up test portfolio
    if (testPortfolioId) {
      await supabase
        .from('portfolios')
        .delete()
        .eq('id', testPortfolioId);
    }
  }

  const passed = results.every(r => r.passed);
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
  };

  return {
    name: 'Position RLS Tests',
    results,
    passed,
    summary,
  };
}

// Test RLS policies for transactions table
export async function testTransactionRLS(): Promise<RLSTestSuite> {
  const results: RLSTestResult[] = [];
  
  if (!isSupabaseAvailable || !supabase) {
    return {
      name: 'Transaction RLS Tests',
      results: [],
      passed: false,
      summary: { total: 0, passed: 0, failed: 1 },
    };
  }

  // Create test portfolio and position for transaction tests
  let testPortfolioId: string | null = null;
  let testPositionId: string | null = null;
  
  try {
    // Create test portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        name: 'RLS Test Portfolio for Transactions',
        description: 'Test portfolio for transaction RLS validation',
        asset_type: 'stocks',
      })
      .select()
      .single();

    if (portfolioError || !portfolio) {
      results.push({
        table: 'transactions',
        operation: 'SELECT',
        success: false,
        error: 'Failed to create test portfolio for transaction tests',
        expectedBehavior: 'ALLOW',
        actualBehavior: 'DENY',
        passed: false,
      });
      
      return {
        name: 'Transaction RLS Tests',
        results,
        passed: false,
        summary: { total: 1, passed: 0, failed: 1 },
      };
    }

    testPortfolioId = portfolio.id;

    // Create test position
    const { data: position, error: positionError } = await supabase
      .from('positions')
      .insert({
        portfolio_id: testPortfolioId,
        symbol: 'RLSTEST',
        name: 'RLS Test Stock',
        quantity: 100,
        average_cost: 10.50,
        total_invested: 1050.00,
      })
      .select()
      .single();

    if (positionError || !position) {
      results.push({
        table: 'transactions',
        operation: 'SELECT',
        success: false,
        error: 'Failed to create test position for transaction tests',
        expectedBehavior: 'ALLOW',
        actualBehavior: 'DENY',
        passed: false,
      });
      
      return {
        name: 'Transaction RLS Tests',
        results,
        passed: false,
        summary: { total: 1, passed: 0, failed: 1 },
      };
    }

    testPositionId = position.id;

    // Test 1: User can view transactions for their own positions
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('position_id', testPositionId)
      .limit(1);
    
    results.push({
      table: 'transactions',
      operation: 'SELECT',
      success: !error,
      error: error?.message,
      expectedBehavior: 'ALLOW',
      actualBehavior: error ? 'DENY' : 'ALLOW',
      passed: !error,
    });

    // Test 2: User can insert transactions for their own positions
    const testTransaction = {
      position_id: testPositionId,
      type: 'BUY' as const,
      quantity: 50,
      price: 11.00,
      transaction_date: new Date().toISOString(),
    };

    const { data: transactionData, error: insertError } = await supabase
      .from('transactions')
      .insert(testTransaction)
      .select()
      .single();
    
    results.push({
      table: 'transactions',
      operation: 'INSERT',
      success: !insertError,
      error: insertError?.message,
      expectedBehavior: 'ALLOW',
      actualBehavior: insertError ? 'DENY' : 'ALLOW',
      passed: !insertError,
    });

    // Clean up test transaction if created
    if (transactionData && !insertError) {
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionData.id);
    }

  } catch (err) {
    results.push({
      table: 'transactions',
      operation: 'SELECT',
      success: false,
      error: (err as Error).message,
      expectedBehavior: 'ALLOW',
      actualBehavior: 'DENY',
      passed: false,
    });
  } finally {
    // Clean up test data
    if (testPositionId) {
      await supabase
        .from('positions')
        .delete()
        .eq('id', testPositionId);
    }
    if (testPortfolioId) {
      await supabase
        .from('portfolios')
        .delete()
        .eq('id', testPortfolioId);
    }
  }

  const passed = results.every(r => r.passed);
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
  };

  return {
    name: 'Transaction RLS Tests',
    results,
    passed,
    summary,
  };
}

// Run all RLS tests
export async function runAllRLSTests(): Promise<{
  suites: RLSTestSuite[];
  overallPassed: boolean;
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}> {
  SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
    action: 'rls_test_started',
    timestamp: new Date().toISOString(),
  });

  const suites: RLSTestSuite[] = [];
  
  try {
    // Run all test suites
    const portfolioTests = await testPortfolioRLS();
    const positionTests = await testPositionRLS();
    const transactionTests = await testTransactionRLS();
    
    suites.push(portfolioTests, positionTests, transactionTests);
    
    const overallPassed = suites.every(suite => suite.passed);
    
    const summary = {
      totalSuites: suites.length,
      passedSuites: suites.filter(s => s.passed).length,
      failedSuites: suites.filter(s => !s.passed).length,
      totalTests: suites.reduce((acc, suite) => acc + suite.summary.total, 0),
      passedTests: suites.reduce((acc, suite) => acc + suite.summary.passed, 0),
      failedTests: suites.reduce((acc, suite) => acc + suite.summary.failed, 0),
    };

    SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      action: 'rls_test_completed',
      passed: overallPassed,
      summary,
      timestamp: new Date().toISOString(),
    });

    return {
      suites,
      overallPassed,
      summary,
    };
  } catch (error) {
    SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      action: 'rls_test_failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

// Utility to format RLS test results for display
export function formatRLSTestResults(results: {
  suites: RLSTestSuite[];
  overallPassed: boolean;
  summary: any;
}): string {
  let output = '\n=== Row Level Security (RLS) Test Results ===\n\n';
  
  results.suites.forEach(suite => {
    output += `${suite.name}: ${suite.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    output += `  Tests: ${suite.summary.passed}/${suite.summary.total} passed\n`;
    
    if (!suite.passed) {
      suite.results.forEach(result => {
        if (!result.passed) {
          output += `  ❌ ${result.table} ${result.operation}: ${result.error}\n`;
        }
      });
    }
    output += '\n';
  });
  
  output += `Overall Result: ${results.overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`;
  output += `Summary: ${results.summary.passedTests}/${results.summary.totalTests} tests passed across ${results.summary.passedSuites}/${results.summary.totalSuites} suites\n`;
  
  return output;
}

// Development utility to run RLS tests (only in development)
export async function runRLSTestsInDev(): Promise<void> {
  if (import.meta.env.PROD) {
    return;
  }

  try {
    const results = await runAllRLSTests();
    const formattedResults = formatRLSTestResults(results);
    
    if (results.overallPassed) {
      // All tests passed
    } else {
      // Some tests failed - this should be addressed
      throw new Error('RLS tests failed - security policies may not be working correctly');
    }
  } catch (error) {
    // RLS test failed - log but don't break the app
    SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      action: 'rls_test_error',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}