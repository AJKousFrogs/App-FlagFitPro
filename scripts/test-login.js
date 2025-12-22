#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

// Test colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin() {
    log('🔐 Testing Login System', 'bright');
    log('Make sure your server is running on http://localhost:3001', 'yellow');
    
    const testCredentials = [
        { email: 'test@flagfitpro.com', password: 'demo123' },
        { email: 'user@example.com', password: 'password' },
        { email: 'admin@flagfit.com', password: 'admin123' },
        { email: 'player@team.com', password: 'anypassword' }
    ];
    
    let passedTests = 0;
    const totalTests = testCredentials.length;
    
    for (const credentials of testCredentials) {
        log(`\n🔍 Testing login with: ${credentials.email} / ${credentials.password}`, 'cyan');
        
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success && data.data.token) {
                log(`   ✅ Login successful!`, 'green');
                log(`   🔑 Token received: ${data.data.token.substring(0, 20)}...`, 'green');
                log(`   👤 User: ${data.data.user.fullName} (${data.data.user.email})`, 'green');
                passedTests++;
            } else {
                log(`   ❌ Login failed`, 'red');
                log(`   📝 Response: ${JSON.stringify(data)}`, 'red');
            }
            
        } catch (error) {
            log(`   💥 Error: ${error.message}`, 'red');
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    log('\n📊 Login Test Summary', 'bright');
    log(`   Total Tests: ${totalTests}`, 'blue');
    log(`   Passed: ${passedTests}`, 'green');
    log(`   Failed: ${totalTests - passedTests}`, 'red');
    
    if (passedTests === totalTests) {
        log('\n🎉 All login tests passed! Your authentication system is working correctly.', 'green');
        log('\n💡 Next Steps:', 'bright');
        log('   1. Open login.html in your browser', 'cyan');
        log('   2. Try logging in with any email and password', 'cyan');
        log('   3. You should be redirected to the dashboard', 'cyan');
    } else {
        log('\n⚠️  Some login tests failed. Check your server and database connection.', 'yellow');
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testLogin().catch(error => {
        log(`\n💥 Test runner failed: ${error.message}`, 'red');
        process.exit(1);
    });
}
