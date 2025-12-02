// Select elements
const element = document.querySelector('.my-element');
const all = document.querySelectorAll('.my-class');

// Modify content
element.textContent = 'New text';
element.innerHTML = '<strong>HTML content</strong>';

// Modify styles and classes
element.style.color = 'blue';
element.classList.add('active');
element.classList.remove('hidden');
element.classList.toggle('highlight');

// Create and append
const div = document.createElement('div');
div.className = 'card';
div.textContent = 'New card';
document.querySelector('.container').appendChild(div);