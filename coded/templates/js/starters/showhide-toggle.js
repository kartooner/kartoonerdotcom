// Show/Hide toggle functionality
// Click a button to show or hide elements

// Simple toggle - show/hide a single element
function toggleElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    if (element.style.display === 'none') {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  }
}

// Toggle with class (better for CSS transitions)
function toggleClass(elementId, className = 'hidden') {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle(className);
  }
}

// Show element
function showElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = '';
    element.classList.remove('hidden');
  }
}

// Hide element
function hideElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
    element.classList.add('hidden');
  }
}

// Toggle multiple elements by class
function toggleByClass(className) {
  const elements = document.querySelectorAll(`.${className}`);
  elements.forEach(element => {
    if (element.style.display === 'none') {
      element.style.display = '';
    } else {
      element.style.display = 'none';
    }
  });
}

// Auto-setup: Attach to buttons with data-toggle attribute
document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-toggle');
    toggleElement(targetId);
  });
});

/*
USAGE EXAMPLES:

1. Button with data-toggle:
   <button data-toggle="myElement">Toggle</button>
   <div id="myElement">Content to toggle</div>

2. Manual toggle:
   <button onclick="toggleElement('myElement')">Toggle</button>
   
3. Show/hide buttons:
   <button onclick="showElement('myElement')">Show</button>
   <button onclick="hideElement('myElement')">Hide</button>
*/