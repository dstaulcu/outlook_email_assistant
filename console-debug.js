// Test script to run in browser console on the deployed add-in
// Copy and paste this into the browser console when the add-in is loaded

console.log('🔧 PromptReply AI Debug Test');
console.log('============================');

// Test 1: Check if the page has loaded
console.log('1. Page load status:', document.readyState);

// Test 2: Check if buttons exist
console.log('2. Checking buttons...');
const buttons = document.querySelectorAll('button');
console.log('   Found buttons:', buttons.length);
buttons.forEach((btn, i) => {
    console.log(`   Button ${i+1}: "${btn.textContent.trim()}"`);
});

// Test 3: Check if AI interface is visible
console.log('3. Checking AI interface...');
const features = document.getElementById('features');
const aiInterface = document.querySelector('[style*="AI Email Assistant"]');
console.log('   Features div:', features ? 'Found' : 'Not found');
console.log('   AI interface:', aiInterface ? 'Found' : 'Not found');

// Test 4: Check if functions are available
console.log('4. Checking functions...');
const functions = ['analyzeEmail', 'generateReply', 'processCustomPrompt', 'showAIInterface', 'loadAIFeatures'];
functions.forEach(func => {
    console.log(`   ${func}:`, typeof window[func]);
});

// Test 5: Check variables
console.log('5. Checking variables...');
console.log('   officeReady:', typeof officeReady !== 'undefined' ? officeReady : 'undefined');
console.log('   aiReady:', typeof aiReady !== 'undefined' ? aiReady : 'undefined');

// Test 6: Check for errors
console.log('6. Any JavaScript errors?');
console.log('   Check the browser console for red error messages');

// Test 7: Force load AI features
console.log('7. Attempting to force load AI features...');
if (typeof loadAIFeatures === 'function') {
    console.log('   Calling loadAIFeatures()...');
    loadAIFeatures();
} else {
    console.log('   loadAIFeatures not available');
}

// Test 8: Force show AI interface
console.log('8. Attempting to force show AI interface...');
if (typeof showAIInterface === 'function') {
    console.log('   Calling showAIInterface()...');
    showAIInterface();
} else {
    console.log('   showAIInterface not available');
}

// Test 9: Manual button test
console.log('9. Creating manual test button...');
const testBtn = document.createElement('button');
testBtn.textContent = '🧪 Test AI Features';
testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer;';
testBtn.onclick = function() {
    console.log('Manual test button clicked!');
    alert('Manual test button works!');
    
    // Try to call AI functions
    if (typeof generateEmailAnalysis === 'function') {
        const result = generateEmailAnalysis('Test email content');
        console.log('generateEmailAnalysis result:', result);
        alert('generateEmailAnalysis works!');
    } else {
        alert('generateEmailAnalysis not available');
    }
};
document.body.appendChild(testBtn);

console.log('🎯 Debug test complete! Check console output above.');
console.log('Look for a red test button in the top-right corner.');
