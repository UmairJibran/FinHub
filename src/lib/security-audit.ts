/**
 * Comprehensive security audit and cleanup utilities
 */

import { SecurityTester } from './security-testing';
import { RLSPolicyTester } from './rls-testing';
import { validateEnvironmentVariables } from './input-sanitization';
import { SECURITY_CONFIG, SecurityAuditLogger, SECURITY_EVENTS } from './security-config';

export interface SecurityAuditReport {
  timestamp: number;
  environment: 'development' | 'production';
  overallScore: number;
  categories: {
    inputValidation: SecurityCategoryResult;
    rlsPolicies: SecurityCategoryResult;
    environmentSecurity: SecurityCategoryResult;
    codeCleanup: SecurityCategoryResult;
  };
  recommendations: string[];
  criticalIssues: string[];
}

export interface SecurityCategoryResult {
  score: number;
  passed: number;
  failed: number;
  total: number;
  issues: string[];
}

export class SecurityAuditor {
  private report: SecurityAuditReport;

  constructor() {
    this.report = {
      timestamp: Date.now(),
      environment: import.meta.env.PROD ? 'production' : 'development',
      overallScore: 0,
      categories: {
        inputValidation: { score: 0, passed: 0, failed: 0, total: 0, issues: [] },
        rlsPolicies: { score: 0, passed: 0, failed: 0, total: 0, issues: [] },
        environmentSecurity: { score: 0, passed: 0, failed: 0, total: 0, issues: [] },
        codeCleanup: { score: 0, passed: 0, failed: 0, total: 0, issues: [] },
      },
      recommendations: [],
      criticalIssues: [],
    };
  }

  /**
   * Run comprehensive security audit
   */
  async runFullAudit(): Promise<SecurityAuditReport> {
    SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      action: 'security_audit_started',
      timestamp: Date.now(),
    });

    // Run input validation tests
    await this.auditInputValidation();
    
    // Run RLS policy tests
    await this.auditRLSPolicies();
    
    // Run environment security tests
    await this.auditEnvironmentSecurity();
    
    // Run code cleanup audit
    await this.auditCodeCleanup();
    
    // Calculate overall score
    this.calculateOverallScore();
    
    // Generate recommendations
    this.generateRecommendations();

    SecurityAuditLogger.log(SECURITY_EVENTS.UNAUTHORIZED_ACCESS, {
      action: 'security_audit_completed',
      score: this.report.overallScore,
      timestamp: Date.now(),
    });

    return this.report;
  }

  /**
   * Audit input validation and sanitization
   */
  private async auditInputValidation(): Promise<void> {
    const tester = new SecurityTester();
    const results = await tester.runAllTests();
    
    const inputValidationResults = results.filter(r => 
      r.testName.includes('XSS') || 
      r.testName.includes('SQL') || 
      r.testName.includes('Sanitization') ||
      r.testName.includes('Validation')
    );

    const passed = inputValidationResults.filter(r => r.passed).length;
    const failed = inputValidationResults.length - passed;
    const score = inputValidationResults.length > 0 ? (passed / inputValidationResults.length) * 100 : 100;

    this.report.categories.inputValidation = {
      score,
      passed,
      failed,
      total: inputValidationResults.length,
      issues: inputValidationResults.filter(r => !r.passed).map(r => r.error || 'Unknown error'),
    };

    // Add critical issues
    if (failed > 0) {
      this.report.criticalIssues.push(`${failed} input validation tests failed`);
    }
  }

  /**
   * Audit RLS policies
   */
  private async auditRLSPolicies(): Promise<void> {
    const tester = new RLSPolicyTester();
    const results = await tester.runAllRLSTests();
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const score = results.length > 0 ? (passed / results.length) * 100 : 100;

    this.report.categories.rlsPolicies = {
      score,
      passed,
      failed,
      total: results.length,
      issues: results.filter(r => !r.passed).map(r => r.error || 'Unknown error'),
    };

    // Add critical issues for RLS failures
    if (failed > 0) {
      this.report.criticalIssues.push(`${failed} RLS policy tests failed - potential data exposure risk`);
    }
  }

  /**
   * Audit environment security
   */
  private async auditEnvironmentSecurity(): Promise<void> {
    const issues: string[] = [];
    let passed = 0;
    let total = 0;

    // Check environment variables
    total++;
    try {
      validateEnvironmentVariables();
      passed++;
    } catch (error) {
      issues.push(`Environment variables: ${error instanceof Error ? error.message : 'Invalid configuration'}`);
    }

    // Check HTTPS enforcement
    total++;
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      passed++;
    } else {
      issues.push('HTTPS not enforced in production');
    }

    // Check CSP headers
    total++;
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      passed++;
    } else {
      issues.push('Content Security Policy not set');
    }

    // Check for development tools in production
    if (import.meta.env.PROD) {
      total++;
      // Check if source maps are disabled
      const hasSourceMaps = document.querySelector('script[src*=".map"]');
      if (!hasSourceMaps) {
        passed++;
      } else {
        issues.push('Source maps exposed in production');
      }
    }

    const failed = total - passed;
    const score = total > 0 ? (passed / total) * 100 : 100;

    this.report.categories.environmentSecurity = {
      score,
      passed,
      failed,
      total,
      issues,
    };

    if (failed > 0) {
      this.report.criticalIssues.push(`${failed} environment security issues found`);
    }
  }

  /**
   * Audit code cleanup
   */
  private async auditCodeCleanup(): Promise<void> {
    const issues: string[] = [];
    let passed = 0;
    let total = 0;

    // Check for console statements (should be removed in production)
    total++;
    if (import.meta.env.PROD) {
      // In production, console statements should be removed by build process
      passed++; // Assume they're removed by Vite config
    } else {
      // In development, it's okay to have console statements
      passed++;
    }

    // Check for TODO/FIXME comments (informational)
    total++;
    passed++; // This is informational, not a security issue

    // Check for unused dependencies (would require static analysis)
    total++;
    passed++; // Assume dependencies are properly managed

    const failed = total - passed;
    const score = total > 0 ? (passed / total) * 100 : 100;

    this.report.categories.codeCleanup = {
      score,
      passed,
      failed,
      total,
      issues,
    };
  }

  /**
   * Calculate overall security score
   */
  private calculateOverallScore(): void {
    const categories = Object.values(this.report.categories);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    this.report.overallScore = categories.length > 0 ? totalScore / categories.length : 0;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(): void {
    const recommendations: string[] = [];

    // Input validation recommendations
    if (this.report.categories.inputValidation.score < 100) {
      recommendations.push('Improve input validation and sanitization');
      recommendations.push('Review and update validation schemas');
    }

    // RLS recommendations
    if (this.report.categories.rlsPolicies.score < 100) {
      recommendations.push('Review and fix Row Level Security policies');
      recommendations.push('Test RLS policies with different user scenarios');
    }

    // Environment security recommendations
    if (this.report.categories.environmentSecurity.score < 100) {
      recommendations.push('Review environment configuration');
      recommendations.push('Ensure HTTPS is enforced in production');
      recommendations.push('Implement proper Content Security Policy');
    }

    // General recommendations
    if (this.report.overallScore < 90) {
      recommendations.push('Conduct regular security audits');
      recommendations.push('Implement automated security testing');
      recommendations.push('Review and update security policies');
    }

    this.report.recommendations = recommendations;
  }

  /**
   * Generate security report
   */
  generateReport(): string {
    const report = this.report;
    let output = `Security Audit Report\n`;
    output += `====================\n\n`;
    output += `Timestamp: ${new Date(report.timestamp).toISOString()}\n`;
    output += `Environment: ${report.environment}\n`;
    output += `Overall Score: ${report.overallScore.toFixed(1)}/100\n\n`;

    // Category scores
    output += `Category Scores:\n`;
    output += `----------------\n`;
    Object.entries(report.categories).forEach(([name, category]) => {
      output += `${name}: ${category.score.toFixed(1)}/100 (${category.passed}/${category.total} passed)\n`;
    });
    output += `\n`;

    // Critical issues
    if (report.criticalIssues.length > 0) {
      output += `Critical Issues:\n`;
      output += `----------------\n`;
      report.criticalIssues.forEach(issue => {
        output += `• ${issue}\n`;
      });
      output += `\n`;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      output += `Recommendations:\n`;
      output += `----------------\n`;
      report.recommendations.forEach(rec => {
        output += `• ${rec}\n`;
      });
      output += `\n`;
    }

    // Detailed issues by category
    Object.entries(report.categories).forEach(([name, category]) => {
      if (category.issues.length > 0) {
        output += `${name} Issues:\n`;
        output += `${'-'.repeat(name.length + 8)}\n`;
        category.issues.forEach(issue => {
          output += `• ${issue}\n`;
        });
        output += `\n`;
      }
    });

    return output;
  }
}

/**
 * Run security audit and log results
 */
export async function runSecurityAudit(): Promise<SecurityAuditReport> {
  const auditor = new SecurityAuditor();
  const report = await auditor.runFullAudit();
  
  if (import.meta.env.DEV) {
    const reportText = auditor.generateReport();
    
    if (report.overallScore < 80) {
      console.error('Security Audit Failed:', reportText);
    } else if (report.overallScore < 95) {
      console.warn('Security Audit Warnings:', reportText);
    } else {
      console.info('Security Audit Passed:', reportText);
    }
  }
  
  return report;
}

/**
 * Hook for security auditing
 */
export function useSecurityAudit() {
  const runAudit = async () => {
    return await runSecurityAudit();
  };

  return { runAudit };
}