// Accessible Drawer Panel
// Side panel with focus trapping, ESC key, and overlay close

class AccessiblePanel {
  constructor(panelSelector) {
    this.panel = document.querySelector(panelSelector);
    if (!this.panel) {
      console.error(`Panel not found: ${panelSelector}`);
      return;
    }
    
    this.overlay = this.panel.querySelector('.panel-overlay');
    this.closeBtn = this.panel.querySelector('.panel-close');
    this.isOpen = false;
    this.previousFocus = null;
    this.focusableElements = [];
    
    this.init();
  }
  
  init() {
    // Close button handler
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    
    // Overlay click to close
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Focus trap handler
    this.panel.addEventListener('keydown', (e) => this.handleFocusTrap(e));
    
    // Handle browser back button
    window.addEventListener('popstate', () => {
      if (this.isOpen) {
        this.close(false); // Don't push history again
      }
    });
  }
  
  open() {
    if (this.isOpen) return;
    
    // Store current focus to restore later
    this.previousFocus = document.activeElement;
    
    // Show panel
    this.panel.hidden = false;
    this.panel.classList.add('active');
    this.isOpen = true;
    
    // Make background content inert (non-interactive)
    this.setBackgroundInert(true);
    
    // Get all focusable elements in panel
    this.updateFocusableElements();
    
    // Focus first focusable element or close button
    if (this.closeBtn) {
      this.closeBtn.focus();
    } else if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
    
    // Add to browser history for back button support
    if (window.history.pushState) {
      window.history.pushState({ panelOpen: true }, '');
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('Panel opened');
  }
  
  close(updateHistory = true) {
    if (!this.isOpen) return;
    
    // Hide panel
    this.panel.hidden = true;
    this.panel.classList.remove('active');
    this.isOpen = false;
    
    // Restore background content
    this.setBackgroundInert(false);
    
    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
    
    // Update history if back button wasn't used
    if (updateHistory && window.history.state?.panelOpen) {
      window.history.back();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('Panel closed');
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  updateFocusableElements() {
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(
      this.panel.querySelectorAll(focusableSelector)
    );
  }
  
  handleFocusTrap(e) {
    if (e.key !== 'Tab' || !this.isOpen) return;
    
    this.updateFocusableElements();
    
    if (this.focusableElements.length === 0) return;
    
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  setBackgroundInert(inert) {
    // Make all siblings of panel container inert
    const siblings = Array.from(document.body.children).filter(
      child => !child.contains(this.panel)
    );
    
    siblings.forEach(sibling => {
      if (inert) {
        sibling.setAttribute('inert', '');
        sibling.setAttribute('aria-hidden', 'true');
      } else {
        sibling.removeAttribute('inert');
        sibling.removeAttribute('aria-hidden');
      }
    });
  }
}

/*
USAGE:

HTML Structure:
<div id="myPanel" class="drawer-panel" hidden>
  <div class="panel-overlay"></div>
  <div class="panel-content">
    <button class="panel-close" aria-label="Close panel">×</button>
    <h2>Panel Title</h2>
    <p>Panel content goes here...</p>
    <button>Action Button</button>
  </div>
</div>

JavaScript:
const drawer = new AccessiblePanel('#myPanel');

// Open the panel
<button onclick="drawer.open()">Open Panel</button>

// Close the panel
<button onclick="drawer.close()">Close Panel</button>

// Toggle the panel
<button onclick="drawer.toggle()">Toggle Panel</button>

CSS (basic example):
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.panel-content {
  position: relative;
  width: 400px;
  height: 100%;
  background: white;
  padding: 2rem;
  margin-left: auto;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}

Features:
- Focus trapping with Tab key
- ESC key to close
- Click overlay to close
- Browser back button support
- Previous focus restoration
- Inert background (non-interactive)
- Prevents body scroll when open
- Full accessibility support
*/