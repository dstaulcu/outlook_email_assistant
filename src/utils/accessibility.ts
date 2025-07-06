/**
 * Keyboard navigation utilities for accessibility
 */

export const KeyboardNavigationUtils = {
  /**
   * Handle keyboard navigation for focus management
   */
  handleKeyboardNavigation: (event: KeyboardEvent, elements: HTMLElement[]) => {
    const currentIndex = elements.findIndex(el => el === document.activeElement);
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex]?.focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
        elements[prevIndex]?.focus();
        break;
        
      case 'Home':
        event.preventDefault();
        elements[0]?.focus();
        break;
        
      case 'End':
        event.preventDefault();
        elements[elements.length - 1]?.focus();
        break;
        
      case 'Enter':
      case ' ':
        // Let the default action happen for buttons
        break;
        
      case 'Escape':
        // Handle escape key for closing panels
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        break;
    }
  },
  
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  },
  
  /**
   * Trap focus within a container (useful for modals/panels)
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = KeyboardNavigationUtils.getFocusableElements(container);
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element
    firstElement.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
  
  /**
   * Add skip link functionality
   */
  addSkipLinks: (container: HTMLElement) => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #0078d4;
      color: white;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      transition: top 0.2s;
    `;
    
    // Show skip link on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    container.prepend(skipLink);
    
    // Add main content landmark
    const mainContent = container.querySelector('[role="main"]') || 
                       container.querySelector('main') ||
                       container.querySelector('#main-content');
    
    if (mainContent) {
      mainContent.id = 'main-content';
    }
  }
};

/**
 * CSS for focus indicators that meet accessibility standards
 */
export const AccessibilityStyles = {
  focusIndicator: `
    outline: 2px solid #0078d4;
    outline-offset: 2px;
    border-radius: 4px;
  `,
  
  highContrastFocusIndicator: `
    outline: 2px solid ButtonText;
    outline-offset: 2px;
    border-radius: 4px;
  `,
  
  skipLink: `
    .skip-link:focus {
      top: 6px !important;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #0078d4;
      color: white;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      transition: top 0.2s;
    }
    
    @media (prefers-contrast: high) {
      .skip-link {
        outline: 2px solid ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }
    }
  `
};
