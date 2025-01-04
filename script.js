// script.js

// Function to copy text
function copyText(id) {
    const textElement = document.getElementById(id);
    const textarea = document.getElementById('hidden-textarea');
    textarea.value = textElement.textContent; // Get text from span
    textarea.select();
    try {
        // Use the execCommand method to copy the text
        document.execCommand('copy');
        
        // Update the button to show that the text has been copied
        const button = textElement.nextElementSibling;
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Copy error:', err);
        alert('Failed to copy text. Please try again.');
    }
}

// Add event listeners to buttons
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copy-bitcoin-button').addEventListener('click', function() {
        copyText('bitcoin-address');
    });
    document.getElementById('copy-ethereum-button').addEventListener('click', function() {
        copyText('ethereum-address');
    });
});
