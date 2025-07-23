/**
 * Row Level Security (RLS) testing utilities
 * Tests to ensure data isolation and security policies work correctly
 */

import { supabase, isSupabaseAvailable } from './supabase/client';
// Database type is available but not used directly in this file

export interface RLSTestResult {
  testName: string;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  passed: boolean;
  error?: string;
  details?: any;
}

export class RLSPolicyTester {
  private results: RLSTestResult[] = [];

  /**
   * Run comprehensive RLS tests
   */
  async runAllRLSTests(): Promise<RLSTestResult[]> {
    this.results = [];

    if (!isSupabaseAvailable || !supabase) {
      this.results.push({
        testName: 'Supabase Availability',
        table: 'N/A',
        operation: 'SELECT',
        passed: false,
        error: 'Supabase client not available',
      });
      return this.results;
    }

    // Ensure supabase is available for all subsequent operations
    const client = supabase;

    // Test each table's RLS policies
    await this.testUserProfilesRLS(client);
    await this.testPortfoliosRLS(client);
    await this.testPositionsRLS(client);
    await this.testTransactionsRLS(client);
    await this.testAssetPricesRLS(client);

    return this.results;
  }

  /**
   * Test user_profiles table RLS policies
   */
  private async testUserProfilesRLS(client: typeof supabase): Promise<void> {
    const table = 'user_profiles';

    // Test 1: Unauthenticated access should be denied
    try {
      const { data, error } = await supabase!
        .from(table)
        .select('*');

      this.results.push({
        testName: 'User Profiles - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: !data || data.length === 0,
        error: data && data.length > 0 ? 'Unauthenticated access allowed' : undefined,
        details: { dataCount: data?.length || 0, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'User Profiles - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: true, // Error is expected
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }

    // Test 2: Try to insert without authentication
    try {
      const { data, error } = await supabase!
        .from(table)
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@example.com',
          full_name: 'Test User',
        });

      this.results.push({
        testName: 'User Profiles - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: !!error,
        error: !error ? 'Unauthenticated insert allowed' : undefined,
        details: { data, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'User Profiles - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Test portfolios table RLS policies
   */
  private async testPortfoliosRLS(): Promise<void> {
    const table = 'portfolios';

    // Test 1: Unauthenticated SELECT should be denied
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      this.results.push({
        testName: 'Portfolios - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: !data || data.length === 0,
        error: data && data.length > 0 ? 'Unauthenticated access allowed' : undefined,
        details: { dataCount: data?.length || 0, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Portfolios - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }

    // Test 2: Try to insert without authentication
    try {
      const { data, error } = await supabase
        .from(table)
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'Test Portfolio',
          asset_type: 'stocks',
        });

      this.results.push({
        testName: 'Portfolios - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: !!error,
        error: !error ? 'Unauthenticated insert allowed' : undefined,
        details: { data, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Portfolios - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Test positions table RLS policies
   */
  private async testPositionsRLS(): Promise<void> {
    const table = 'positions';

    // Test 1: Unauthenticated SELECT should be denied
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      this.results.push({
        testName: 'Positions - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: !data || data.length === 0,
        error: data && data.length > 0 ? 'Unauthenticated access allowed' : undefined,
        details: { dataCount: data?.length || 0, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Positions - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }

    // Test 2: Try to insert without authentication
    try {
      const { data, error } = await supabase
        .from(table)
        .insert({
          portfolio_id: '00000000-0000-0000-0000-000000000000',
          symbol: 'TEST',
          name: 'Test Stock',
          quantity: 100,
          average_cost: 50,
          total_invested: 5000,
        });

      this.results.push({
        testName: 'Positions - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: !!error,
        error: !error ? 'Unauthenticated insert allowed' : undefined,
        details: { data, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Positions - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Test transactions table RLS policies
   */
  private async testTransactionsRLS(): Promise<void> {
    const table = 'transactions';

    // Test 1: Unauthenticated SELECT should be denied
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      this.results.push({
        testName: 'Transactions - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: !data || data.length === 0,
        error: data && data.length > 0 ? 'Unauthenticated access allowed' : undefined,
        details: { dataCount: data?.length || 0, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Transactions - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }

    // Test 2: Try to insert without authentication
    try {
      const { data, error } = await supabase
        .from(table)
        .insert({
          position_id: '00000000-0000-0000-0000-000000000000',
          type: 'BUY',
          quantity: 100,
          price: 50,
          transaction_date: new Date().toISOString(),
        });

      this.results.push({
        testName: 'Transactions - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: !!error,
        error: !error ? 'Unauthenticated insert allowed' : undefined,
        details: { data, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Transactions - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Test asset_prices table RLS policies
   */
  private async testAssetPricesRLS(): Promise<void> {
    const table = 'asset_prices';

    // Test 1: Unauthenticated SELECT should be allowed (public data)
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      this.results.push({
        testName: 'Asset Prices - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: !error, // Should be allowed
        error: error ? 'Public read access denied' : undefined,
        details: { dataCount: data?.length || 0, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Asset Prices - Unauthenticated SELECT',
        table,
        operation: 'SELECT',
        passed: false,
        error: 'Public read access should be allowed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }

    // Test 2: Try to insert without authentication (should be denied)
    try {
      const { data, error } = await supabase
        .from(table)
        .insert({
          symbol: 'TEST',
          name: 'Test Asset',
          current_price: 100,
          currency: 'USD',
        });

      this.results.push({
        testName: 'Asset Prices - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: !!error,
        error: !error ? 'Unauthenticated insert allowed' : undefined,
        details: { data, error },
      });
    } catch (error) {
      this.results.push({
        testName: 'Asset Prices - Unauthenticated INSERT',
        table,
        operation: 'INSERT',
        passed: true,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Test RLS policy existence
   */
  async testPolicyExistence(): Promise<void> {
    try {
      // Query to check if RLS is enabled on tables
      const { data: tables } = await supabase
        .rpc('check_rls_status');

      if (tables) {
        const requiredTables = ['user_profiles', 'portfolios', 'positions', 'transactions', 'asset_prices'];
        
        for (const tableName of requiredTables) {
          const table = tables.find((t: any) => t.table_name === tableName);
          
          this.results.push({
            testName: `RLS Enabled - ${tableName}`,
            table: tableName,
            operation: 'SELECT',
            passed: table?.rls_enabled === true,
            error: table?.rls_enabled !== true ? 'RLS not enabled' : undefined,
            details: { table },
          });
        }
      }
    } catch (error) {
      // If the RPC doesn't exist, we'll skip this test
      this.results.push({
        testName: 'RLS Status Check',
        table: 'N/A',
        operation: 'SELECT',
        passed: false,
        error: 'Could not check RLS status - RPC function may not exist',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Get test results summary
   */
  getTestSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    byTable: Record<string, { passed: number; failed: number }>;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    // Group by table
    const byTable: Record<string, { passed: number; failed: number }> = {};
    this.results.forEach(result => {
      if (!byTable[result.table]) {
        byTable[result.table] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        byTable[result.table].passed++;
      } else {
        byTable[result.table].failed++;
      }
    });

    return { total, passed, failed, passRate, byTable };
  }

  /**
   * Get failed tests
   */
  getFailedTests(): RLSTestResult[] {
    return this.results.filter(r => !r.passed);
  }

  /**
   * Generate RLS test report
   */
  generateReport(): string {
    const summary = this.getTestSummary();
    const failedTests = this.getFailedTests();

    let report = `RLS Policy Test Report\n`;
    report += `=====================\n\n`;
    report += `Total Tests: ${summary.total}\n`;
    report += `Passed: ${summary.passed}\n`;
    report += `Failed: ${summary.failed}\n`;
    report += `Pass Rate: ${summary.passRate.toFixed(1)}%\n\n`;

    // Summary by table
    report += `Results by Table:\n`;
    report += `-----------------\n`;
    Object.entries(summary.byTable).forEach(([table, stats]) => {
      const tablePassRate = ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1);
      report += `${table}: ${stats.passed}/${stats.passed + stats.failed} (${tablePassRate}%)\n`;
    });
    report += `\n`;

    if (failedTests.length > 0) {
      report += `Failed Tests:\n`;
      report += `-------------\n`;
      failedTests.forEach(test => {
        report += `• ${test.testName} (${test.table} ${test.operation}): ${test.error}\n`;
      });
    } else {
      report += `All RLS tests passed! ✅\n`;
    }

    return report;
  }
}

/**
 * Run RLS tests and return results
 */
export async function runRLSTests(): Promise<RLSTestResult[]> {
  const tester = new RLSPolicyTester();
  return await tester.runAllRLSTests();
}

/**
 * Run RLS tests and log results (development only)
 */
export async function runAndLogRLSTests(): Promise<void> {
  if (import.meta.env.PROD) {
    return; // Don't run in production
  }

  const tester = new RLSPolicyTester();
  await tester.runAllRLSTests();
  
  const report = tester.generateReport();
  const summary = tester.getTestSummary();
  
  if (summary.failed > 0) {
    console.warn('RLS Tests Failed:', report);
  } else {
    console.info('RLS Tests Passed:', report);
  }
}

/**
 * Hook for RLS testing in development
 */
export function useRLSTesting() {
  const runTests = async () => {
    const tester = new RLSPolicyTester();
    return await tester.runAllRLSTests();
  };

  return { runTests };
}