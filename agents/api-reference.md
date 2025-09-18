# API Reference

## Product Management APIs

### Products Service (`app/lib/products.ts`)
- `getProducts()` - Fetch all products ordered by creation date
- `addProduct(product)` - Create new product with automatic inventory setup
- `updateProduct(id, updates)` - Update existing product
- `deleteProduct(id, imageUrl)` - Delete product and associated image
- `checkWeeklyCap(productId, quantity)` - Validate inventory availability
- `resetWeeklyAmounts()` - Reset all product inventory to weekly caps

### Order Management
- `createOrder(order)` - Process new order with inventory updates
- `getOrders()` - Fetch all orders ordered by creation date
- `updateOrderStatus(id, status)` - Update order status ('open' | 'completed' | 'cancelled')
- `isOrderWindowOpen()` - Check if ordering is currently allowed

## API Routes

### Stripe Integration (`app/api/stripe/`)
- `POST /api/stripe/create-payment-intent` - Create Stripe payment intent
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Order Processing (`app/api/orders/`)
- `POST /api/orders/send-confirmation` - Send order confirmation email
- `POST /api/orders/verify` - Verify and process order from Stripe

### Newsletter (`app/api/newsletter/`)
- `POST /api/newsletter/send` - Send newsletter to subscribers

### Settings (`app/api/settings/`)
- `GET /api/settings` - Fetch application settings
- `POST /api/settings` - Update application settings

## Data Models

### Product Interface
```typescript
interface Product {
  id?: string;
  name: string;
  price: string;
  image: string; // Firebase Storage URL
  quantity?: string; // Description (e.g., "6 cookies")
  weeklyCap?: number; // Max items per week
  weeklyAmountRemaining?: number; // Current availability
  createdAt?: any;
  updatedAt?: any;
}
```

### Order Interface
```typescript
interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'completed' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}
```

### Cart Item Interface
```typescript
interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  description: string;
  image: string;
  maxQuantity?: number;
}
```