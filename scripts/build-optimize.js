#!/usr/bin/env node

/**
 * Build optimization script
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Analyze bundle files
 */
function analyzeBundleFiles() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));

  console.log('📊 Bundle Analysis\n');

  // Analyze JavaScript files
  console.log('🟨 JavaScript Files:');
  let totalJSSize = 0;
  jsFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const sizeKB = parseFloat(getFileSizeKB(filePath));
    totalJSSize += sizeKB;
    
    const sizeStatus = sizeKB > 500 ? '🔴' : sizeKB > 200 ? '🟡' : '🟢';
    console.log(`  ${sizeStatus} ${file}: ${sizeKB} KB`);
  });

  // Analyze CSS files
  console.log('\n🟦 CSS Files:');
  let totalCSSSize = 0;
  cssFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const sizeKB = parseFloat(getFileSizeKB(filePath));
    totalCSSSize += sizeKB;
    
    const sizeStatus = sizeKB > 100 ? '🔴' : sizeKB > 50 ? '🟡' : '🟢';
    console.log(`  ${sizeStatus} ${file}: ${sizeKB} KB`);
  });

  console.log(`\n📈 Total Bundle Size: ${(totalJSSize + totalCSSSize).toFixed(2)} KB`);
  console.log(`   JavaScript: ${totalJSSize.toFixed(2)} KB`);
  console.log(`   CSS: ${totalCSSSize.toFixed(2)} KB`);

  return { totalJSSize, totalCSSSize, jsFiles, cssFiles };
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(analysis) {
  console.log('\n💡 Optimization Recommendations:\n');

  const { totalJSSize, totalCSSSize, jsFiles } = analysis;

  // Bundle size recommendations
  if (totalJSSize > 1000) {
    console.log('🔴 JavaScript bundle is large (>1MB). Consider:');
    console.log('   • Implementing more aggressive code splitting');
    console.log('   • Lazy loading non-critical components');
    console.log('   • Removing unused dependencies');
  } else if (totalJSSize > 500) {
    console.log('🟡 JavaScript bundle is moderate (>500KB). Consider:');
    console.log('   • Code splitting for calculator modules');
    console.log('   • Dynamic imports for heavy libraries');
  } else {
    console.log('🟢 JavaScript bundle size is good (<500KB)');
  }

  if (totalCSSSize > 100) {
    console.log('🔴 CSS bundle is large (>100KB). Consider:');
    console.log('   • Purging unused Tailwind classes');
    console.log('   • CSS code splitting');
  } else {
    console.log('🟢 CSS bundle size is good (<100KB)');
  }

  // Chunk analysis
  const vendorChunks = jsFiles.filter(file => file.includes('vendor'));
  if (vendorChunks.length === 0) {
    console.log('🟡 No vendor chunks detected. Consider splitting vendor code.');
  }

  const calculatorChunks = jsFiles.filter(file => 
    file.includes('calculator') || file.includes('sip') || file.includes('zakat')
  );
  if (calculatorChunks.length === 0) {
    console.log('🟡 Calculator modules not split. Consider lazy loading calculators.');
  }

  console.log('\n🚀 Performance Tips:');
  console.log('   • Enable gzip/brotli compression on your server');
  console.log('   • Use a CDN for static assets');
  console.log('   • Implement service worker caching');
  console.log('   • Consider preloading critical resources');
}

/**
 * Check for common performance issues
 */
function checkPerformanceIssues() {
  console.log('\n🔍 Performance Issue Check:\n');

  // Check for source maps in production
  const files = fs.readdirSync(ASSETS_DIR);
  const sourceMaps = files.filter(file => file.endsWith('.map'));
  
  if (sourceMaps.length > 0) {
    console.log('🔴 Source maps found in production build:');
    sourceMaps.forEach(file => console.log(`   • ${file}`));
    console.log('   Consider disabling source maps for production');
  } else {
    console.log('🟢 No source maps in production build');
  }

  // Check for console statements (basic check)
  const jsFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.map'));
  let consoleStatementsFound = false;
  
  jsFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('console.log') || content.includes('console.warn')) {
      console.log(`🟡 Console statements found in ${file}`);
      consoleStatementsFound = true;
    }
  });

  if (!consoleStatementsFound) {
    console.log('🟢 No console statements found in production build');
  }

  // Check for large individual files
  jsFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const sizeKB = parseFloat(getFileSizeKB(filePath));
    
    if (sizeKB > 1000) {
      console.log(`🔴 Large file detected: ${file} (${sizeKB} KB)`);
      console.log('   Consider splitting this chunk further');
    }
  });
}

/**
 * Generate performance report
 */
function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    bundleSize: {
      javascript: analysis.totalJSSize,
      css: analysis.totalCSSSize,
      total: analysis.totalJSSize + analysis.totalCSSSize
    },
    files: {
      javascript: analysis.jsFiles.length,
      css: analysis.cssFiles.length
    },
    recommendations: []
  };

  // Add recommendations based on analysis
  if (analysis.totalJSSize > 1000) {
    report.recommendations.push('Reduce JavaScript bundle size');
  }
  if (analysis.totalCSSSize > 100) {
    report.recommendations.push('Optimize CSS bundle size');
  }

  const reportPath = path.join(DIST_DIR, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Performance report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 FinHub Build Optimization Analysis\n');

  try {
    const analysis = analyzeBundleFiles();
    provideRecommendations(analysis);
    checkPerformanceIssues();
    generateReport(analysis);
    
    console.log('\n✅ Analysis complete!');
    
    // Exit with error code if bundle is too large
    if (analysis.totalJSSize + analysis.totalCSSSize > 2000) {
      console.log('\n❌ Bundle size exceeds 2MB threshold');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeBundleFiles, provideRecommendations, checkPerformanceIssues };