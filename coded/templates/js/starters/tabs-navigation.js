// Accessible Tabs Navigation
// Full-featured tab interface with keyboard support and ARIA

class TabsNavigation {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;
    
    this.tabList = this.container.querySelector('[role="tablist"]');
    this.tabs = Array.from(this.tabList.querySelectorAll('[role="tab"]'));
    this.tabPanels = Array.from(this.container.querySelectorAll('[role="tabpanel"]'));
    this.scrollLeftBtn = this.container.querySelector('.scroll-left');
    this.scrollRightBtn = this.container.querySelector('.scroll-right');
    
    this.init();
  }
  
  init() {
    // Set up click handlers
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.switchTab(index));
    });
    
    // Set up keyboard navigation
    this.tabList.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Set up scroll buttons if they exist
    if (this.scrollLeftBtn) {
      this.scrollLeftBtn.addEventListener('click', () => this.scrollTabs('left'));
    }
    if (this.scrollRightBtn) {
      this.scrollRightBtn.addEventListener('click', () => this.scrollTabs('right'));
    }
    
    // Show first tab by default
    this.switchTab(0);
  }
  
  switchTab(index) {
    // Update all tabs to inactive state
    this.tabs.forEach((tab, i) => {
      const isSelected = i === index;
      
      // Update ARIA attributes
      tab.setAttribute('aria-selected', isSelected);
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      
      // Update visual state
      if (isSelected) {
        tab.classList.add('active');
        tab.focus();
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Show corresponding panel, hide others
    this.tabPanels.forEach((panel, i) => {
      if (i === index) {
        panel.hidden = false;
        panel.classList.add('active');
      } else {
        panel.hidden = true;
        panel.classList.remove('active');
      }
    });
  }
  
  handleKeydown(e) {
    const currentIndex = this.tabs.findIndex(tab => tab === document.activeElement);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
        break;
        
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
        
      case 'End':
        e.preventDefault();
        newIndex = this.tabs.length - 1;
        break;
        
      default:
        return;
    }
    
    this.switchTab(newIndex);
  }
  
  scrollTabs(direction) {
    const scrollAmount = 200;
    const currentScroll = this.tabList.scrollLeft;
    
    if (direction === 'left') {
      this.tabList.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth'
      });
    } else {
      this.tabList.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}

/*
USAGE:

HTML Structure:
<div class="tabs-container">
  <button class="scroll-left" aria-label="Scroll tabs left">←</button>
  <div role="tablist" aria-label="Main tabs">
    <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
      Tab 1
    </button>
    <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">
      Tab 2
    </button>
    <button role="tab" aria-selected="false" aria-controls="panel-3" id="tab-3" tabindex="-1">
      Tab 3
    </button>
  </div>
  <button class="scroll-right" aria-label="Scroll tabs right">→</button>
</div>

<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Panel 1 content
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
  Panel 2 content
</div>
<div role="tabpanel" id="panel-3" aria-labelledby="tab-3" hidden>
  Panel 3 content
</div>

JavaScript:
const tabs = new TabsNavigation('.tabs-container');

Features:
- Click to switch tabs
- Arrow keys to navigate (Left/Right)
- Home/End keys to jump to first/last tab
- Roving tabindex for keyboard focus management
- Optional scroll buttons for overflow
- Full ARIA support for screen readers
*/