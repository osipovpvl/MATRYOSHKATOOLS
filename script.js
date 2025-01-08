/*
 * Copyright 2025 PAVEL OSIPOV (MATRYOSHKA TOOLS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        }, 300);
    } catch (err) {
        //console.error('Copy error:', err);
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
