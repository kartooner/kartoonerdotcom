// Accordion control for <details> elements
// Programmatically open, close, or toggle accordions

// Open a specific accordion item
function openAccordion(detailsId) {
  const details = document.getElementById(detailsId);
  if (details) {
    details.open = true;
  }
}

// Close a specific accordion item
function closeAccordion(detailsId) {
  const details = document.getElementById(detailsId);
  if (details) {
    details.open = false;
  }
}

// Toggle a specific accordion item
function toggleAccordion(detailsId) {
  const details = document.getElementById(detailsId);
  if (details) {
    details.open = !details.open;
  }
}

// Open all accordions in a container
function openAll(containerSelector = '.faq-list') {
  const container = document.querySelector(containerSelector);
  if (container) {
    const allDetails = container.querySelectorAll('details');
    allDetails.forEach(details => {
      details.open = true;
    });
  }
}

// Close all accordions in a container
function closeAll(containerSelector = '.faq-list') {
  const container = document.querySelector(containerSelector);
  if (container) {
    const allDetails = container.querySelectorAll('details');
    allDetails.forEach(details => {
      details.open = false;
    });
  }
}

// Auto-close other items when one opens (accordion behavior)
function setupExclusiveAccordion(containerSelector = '.faq-list') {
  const container = document.querySelector(containerSelector);
  if (container) {
    const allDetails = container.querySelectorAll('details');
    
    allDetails.forEach(details => {
      details.addEventListener('toggle', (e) => {
        if (details.open) {
          // Close all other details
          allDetails.forEach(otherDetails => {
            if (otherDetails !== details) {
              otherDetails.open = false;
            }
          });
        }
      });
    });
  }
}

// Track accordion state changes
function trackAccordionChanges(containerSelector = '.faq-list') {
  const container = document.querySelector(containerSelector);
  if (container) {
    const allDetails = container.querySelectorAll('details');
    
    allDetails.forEach((details, index) => {
      details.addEventListener('toggle', () => {
        const state = details.open ? 'opened' : 'closed';
        console.log(`Accordion ${index + 1} ${state}`);
      });
    });
  }
}

/*
USAGE:

1. Open/close all buttons:
   <button onclick="openAll()">Expand All</button>
   <button onclick="closeAll()">Collapse All</button>

2. Exclusive accordion (only one open at a time):
   setupExclusiveAccordion();

3. Individual control:
   <button onclick="openAccordion('faq1')">Open FAQ 1</button>
   <details id="faq1">...</details>

Pairs with "FAQ Accordion" HTML template
*/