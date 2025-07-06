// PromptReply AI Features Diagnostic Script
// Run this in browser console to test AI features

console.log('🤖 PromptReply AI Features Diagnostic');
console.log('=====================================');

// Test 1: Check if AI functions exist
console.log('\n1. Testing AI function availability...');
const aiFunctions = ['analyzeEmail', 'generateReply', 'processCustomPrompt', 'generateEmailAnalysis', 'generateCustomResponse'];
aiFunctions.forEach(func => {
    if (typeof window[func] === 'function') {
        console.log(`✅ ${func} - Available`);
    } else {
        console.log(`❌ ${func} - Not found`);
    }
});

// Test 2: Check if DOM elements exist
console.log('\n2. Testing DOM elements...');
const elements = ['customPrompt', 'aiResults', 'aiOutput'];
elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id} - Found`);
    } else {
        console.log(`❌ ${id} - Not found`);
    }
});

// Test 3: Test AI functions
console.log('\n3. Testing AI functions...');

// Test email analysis
if (typeof generateEmailAnalysis === 'function') {
    const testEmail = 'Subject: Test\n\nHello, this is a test email. Thank you.';
    const analysis = generateEmailAnalysis(testEmail);
    console.log('✅ Email analysis working:', analysis.substring(0, 100) + '...');
} else {
    console.log('❌ Email analysis not available');
}

// Test custom response
if (typeof generateCustomResponse === 'function') {
    const testPrompt = 'help';
    const response = generateCustomResponse(testPrompt);
    console.log('✅ Custom response working:', response.substring(0, 100) + '...');
} else {
    console.log('❌ Custom response not available');
}

// Test 4: Check Office.js status
console.log('\n4. Testing Office.js integration...');
if (typeof Office !== 'undefined') {
    console.log('✅ Office.js loaded');
    console.log('   Context:', Office.context ? 'Available' : 'Not available');
} else {
    console.log('❌ Office.js not loaded');
}

// Test 5: Check clipboard API
console.log('\n5. Testing clipboard API...');
if (navigator.clipboard && navigator.clipboard.writeText) {
    console.log('✅ Clipboard API available');
} else {
    console.log('❌ Clipboard API not available');
}

console.log('\n🎯 Diagnostic complete!');
console.log('Run individual tests:');
console.log('- testAnalyzeEmail()');
console.log('- testGenerateReply()');
console.log('- testCustomPrompt()');

// Individual test functions
window.testAnalyzeEmail = function() {
    if (typeof analyzeEmail === 'function') {
        console.log('Testing analyzeEmail...');
        analyzeEmail();
    } else {
        console.log('analyzeEmail function not available');
    }
};

window.testGenerateReply = function() {
    if (typeof generateReply === 'function') {
        console.log('Testing generateReply...');
        generateReply('professional');
    } else {
        console.log('generateReply function not available');
    }
};

window.testCustomPrompt = function() {
    if (typeof processCustomPrompt === 'function') {
        console.log('Testing processCustomPrompt...');
        const promptInput = document.getElementById('customPrompt');
        if (promptInput) {
            promptInput.value = 'help';
            processCustomPrompt();
        } else {
            console.log('Custom prompt input not found');
        }
    } else {
        console.log('processCustomPrompt function not available');
    }
};
