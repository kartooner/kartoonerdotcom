// Filter/Search functionality
// Search through items and show only matches

// Basic search filter
function filterBySearch(searchInput, itemsSelector, textSelector) {
  const query = searchInput.value.toLowerCase();
  const items = document.querySelectorAll(itemsSelector);
  
  items.forEach(item => {
    const text = item.querySelector(textSelector)?.textContent.toLowerCase() || '';  const fullText = item.textContent.toLowerCase();
    
    if (fullText.includes(query)) {
      item.style.display = '';
      item.classList.remove('hidden');
    } else {
      item.style.display = 'none';
      item.classList.add('hidden');
    }
  });
}

// Setup search with input element
function setupSearch(inputId, itemsSelector) {
  const searchInput = document.getElementById(inputId);
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const items = document.querySelectorAll(itemsSelector);
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        
        if (text.includes(query)) {
          item.style.display = '';
          item.classList.remove('hidden');
        } else {
          item.style.display = 'none';
          item.classList.add('hidden');
        }
      });
      
      console.log(`Searching for: "${query}"`);
    });
  }
}

// Advanced: Filter with highlighting
function searchWithHighlight(inputId, itemsSelector) {
  const searchInput = document.getElementById(inputId);
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const items = document.querySelectorAll(itemsSelector);
      
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        
        if (query && text.includes(query)) {
          item.style.display = '';
          item.classList.remove('hidden');
          item.style.backgroundColor = '#fff3cd'; // Highlight
        } else if (query) {
          item.style.display = 'none';
          item.classList.add('hidden');
        } else {
          item.style.display = '';
          item.classList.remove('hidden');
          item.style.backgroundColor = '';
        }
      });
    });
  }
}

/*
USAGE:

1. Basic setup:
   <input type="search" id="searchBox" placeholder="Search...">
   <div class="item">Item 1</div>
   <div class="item">Item 2</div>
   
   setupSearch('searchBox', '.item');

2. With highlighting:
   searchWithHighlight('searchBox', '.item');

Pairs with "Filter/Categories" or "News/Media Feature" templates
*/