/* ── Toast Notification System ── */
let toastContainer = null;

function createToastContainer() {
  if (toastContainer) return;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toastContainer';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
  // Add styles if not already present
  if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      
      .toast {
        pointer-events: auto;
        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 12px;
        background: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: toastSlideIn 0.3s ease-out;
        font-family: 'Outfit', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }
      
      @keyframes toastSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes toastSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .toast.removing {
        animation: toastSlideOut 0.3s ease-in forwards;
      }
      
      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
        line-height: 1;
      }
      
      .toast-content {
        flex: 1;
        min-width: 0;
      }
      
      .toast-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-1, #1a1a1a);
      }
      
      .toast-message {
        color: var(--text-2, #666);
        word-break: break-word;
      }
      
      .toast-close {
        background: none;
        border: none;
        color: var(--text-3, #999);
        cursor: pointer;
        padding: 4px;
        font-size: 18px;
        line-height: 1;
        flex-shrink: 0;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .toast-close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-1, #1a1a1a);
      }
      
      /* Toast variants */
      .toast.success {
        border-left: 4px solid #10b981;
      }
      
      .toast.success .toast-icon {
        color: #10b981;
      }
      
      .toast.error {
        border-left: 4px solid #ef4444;
      }
      
      .toast.error .toast-icon {
        color: #ef4444;
      }
      
      .toast.warning {
        border-left: 4px solid #f59e0b;
      }
      
      .toast.warning .toast-icon {
        color: #f59e0b;
      }
      
      .toast.info {
        border-left: 4px solid #3b82f6;
      }
      
      .toast.info .toast-icon {
        color: #3b82f6;
      }
      
      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        .toast {
          background: #2a2a2a;
        }
        
        .toast-title {
          color: #f5f5f5;
        }
        
        .toast-message {
          color: #b3b3b3;
        }
        
        .toast-close {
          color: #888;
        }
        
        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f5f5f5;
        }
      }
      
      .dark-mode .toast {
        background: #2a2a2a;
      }
      
      .dark-mode .toast-title {
        color: #f5f5f5;
      }
      
      .dark-mode .toast-message {
        color: #b3b3b3;
      }
      
      .dark-mode .toast-close {
        color: #888;
      }
      
      .dark-mode .toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f5f5f5;
      }
    `;
    document.head.appendChild(style);
  }
}

export function toast(options) {
  createToastContainer();
  
  const {
    type = 'info',
    title = '',
    message = '',
    duration = 5000,
    persistent = false
  } = options;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">✕</button>
  `;
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  toastContainer.appendChild(toast);
  
  if (!persistent && duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
  
  return toast;
}

function removeToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  
  toast.classList.add('removing');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

export function toastSuccess(message, title = 'Success') {
  return toast({ type: 'success', title, message });
}

export function toastError(message, title = 'Error') {
  return toast({ type: 'error', title, message, duration: 7000 });
}

export function toastWarning(message, title = 'Warning') {
  return toast({ type: 'warning', title, message });
}

export function toastInfo(message, title = 'Info') {
  return toast({ type: 'info', title, message });
}

export function clearToasts() {
  if (!toastContainer) return;
  
  const toasts = toastContainer.querySelectorAll('.toast');
  toasts.forEach((t, i) => {
    setTimeout(() => removeToast(t), i * 50);
  });
}
