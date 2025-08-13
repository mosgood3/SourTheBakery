import DOMPurify from 'isomorphic-dompurify';

// HTML escaping function for email templates
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sanitize HTML content (for newsletter content)
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

// Email validation
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate order data
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
}

export interface ValidatedOrderData {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: string;
}

export function validateOrderData(data: any): { valid: boolean; data?: ValidatedOrderData; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid order data format');
    return { valid: false, errors };
  }

  // Validate customer name
  if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.trim().length === 0) {
    errors.push('Customer name is required');
  } else if (data.customerName.length > 100) {
    errors.push('Customer name is too long (max 100 characters)');
  }

  // Validate customer email
  if (!validateEmail(data.customerEmail)) {
    errors.push('Valid customer email is required');
  }

  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  } else if (data.items.length > 50) {
    errors.push('Too many items in order (max 50)');
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item.productId || typeof item.productId !== 'string') {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.productName || typeof item.productName !== 'string') {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 100) {
        errors.push(`Item ${index + 1}: Invalid quantity (must be 1-100)`);
      }
      if (!item.price || typeof item.price !== 'string') {
        errors.push(`Item ${index + 1}: Price is required`);
      }
    });
  }

  // Validate total
  if (typeof data.total !== 'number' || data.total <= 0 || data.total > 10000) {
    errors.push('Invalid order total (must be between $0.01 and $10,000)');
  }

  // Validate status
  if (!['open', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('Invalid order status');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim().toLowerCase(),
      items: data.items,
      total: data.total,
      status: data.status
    },
    errors: []
  };
}

// Validate newsletter data
export function validateNewsletterData(data: any): { valid: boolean; data?: any; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid newsletter data format');
    return { valid: false, errors };
  }

  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0) {
    errors.push('Subject is required');
  } else if (data.subject.length > 200) {
    errors.push('Subject is too long (max 200 characters)');
  }

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (data.content.length > 50000) {
    errors.push('Content is too long (max 50,000 characters)');
  }

  if (!data.sentBy || typeof data.sentBy !== 'string' || data.sentBy.trim().length === 0) {
    errors.push('Sender is required');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      subject: data.subject.trim(),
      content: sanitizeHtml(data.content),
      sentBy: data.sentBy.trim()
    },
    errors: []
  };
}