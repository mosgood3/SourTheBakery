# Race Condition Test Script

## Purpose
This test verifies that the inventory race condition has been fixed.

## Test Scenario

**Setup:**
- Product: "Sourdough Bread"
- Available Inventory: 2 units
- Two users try to buy 2 units each simultaneously

**Expected Outcome (After Fix):**
- ✅ User A's order succeeds (gets 2 units)
- ❌ User B's order fails with "Insufficient stock"
- Final inventory: 0 units
- Total sold: 2 units (correct!)

**Previous Behavior (Before Fix):**
- ✅ User A's order succeeds (gets 2 units)
- ✅ User B's order succeeds (gets 2 units) ⚠️ OVERSOLD
- Final inventory: 0 or -2 units
- Total sold: 4 units (WRONG!)

---

## Manual Browser Test

### Preparation

1. Log into your admin panel
2. Create a test product:
   - Name: "Race Condition Test Product"
   - Price: $1.00
   - Weekly Cap: 2
   - Weekly Amount Remaining: 2

### Test Steps

1. **Open two browser windows** (or use Chrome + Incognito)

2. **In both windows:**
   - Navigate to your bakery site
   - Add 2x "Race Condition Test Product" to cart
   - Go to checkout
   - Fill in your email and card details
   - **PAUSE before clicking "Pay with Card"**

3. **Click "Pay with Card" in both windows at the same time**
   - Tip: Press Enter in both windows simultaneously

4. **Expected Results:**
   - Window 1: ✅ "Order Placed Successfully!"
   - Window 2: ❌ Error: "Race Condition Test Product has reached its weekly limit. Only 0 available this week."

5. **Verify in Admin Panel:**
   - Check Orders: Should see only 1 order
   - Check Product: Weekly Amount Remaining should be 0

---

## Automated Test (Node.js)

You can also create an automated test:

```javascript
// tests/race-condition.test.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function simulateConcurrentOrders() {
  const productId = 'your-test-product-id';

  // Create two payment intents simultaneously
  const order1 = fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test User A',
      customerEmail: 'test-a@example.com',
      items: [{ id: productId, name: 'Test Product', price: '$1.00', quantity: 2 }],
      pickupInfo: { date: '2025-11-01', timeStart: '09:00', timeEnd: '12:00', location: 'Test' }
    })
  });

  const order2 = fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test User B',
      customerEmail: 'test-b@example.com',
      items: [{ id: productId, name: 'Test Product', price: '$1.00', quantity: 2 }],
      pickupInfo: { date: '2025-11-01', timeStart: '09:00', timeEnd: '12:00', location: 'Test' }
    })
  });

  // Wait for both to complete
  const [response1, response2] = await Promise.all([order1, order2]);

  console.log('Order 1:', response1.ok ? 'SUCCESS' : 'FAILED');
  console.log('Order 2:', response2.ok ? 'SUCCESS' : 'FAILED');

  // Expected: One succeeds, one fails
  if (response1.ok && !response2.ok) {
    console.log('✅ Race condition test PASSED - Order 1 succeeded, Order 2 failed');
  } else if (!response1.ok && response2.ok) {
    console.log('✅ Race condition test PASSED - Order 2 succeeded, Order 1 failed');
  } else if (response1.ok && response2.ok) {
    console.log('❌ Race condition test FAILED - Both orders succeeded (overselling!)');
  } else {
    console.log('⚠️ Both orders failed - check your test setup');
  }
}

simulateConcurrentOrders();
```

---

## Database Verification

You can also verify at the database level:

```sql
-- Check product inventory
SELECT id, name, weekly_cap, weekly_amount_remaining
FROM products
WHERE name = 'Race Condition Test Product';

-- Check order count
SELECT COUNT(*) as order_count
FROM orders
WHERE items::jsonb @> '[{"productName": "Race Condition Test Product"}]'::jsonb;

-- If order_count = 1 and weekly_amount_remaining = 0, test PASSED ✅
-- If order_count = 2 and weekly_amount_remaining = 0 or -2, test FAILED ❌
```

---

## Load Test (Advanced)

For production confidence, you can run a load test:

```bash
# Using Apache Bench
ab -n 100 -c 10 -p order.json -T application/json \
  https://yourdomain.com/api/stripe/create-payment-intent

# Using k6
k6 run load-test.js
```

Expected: Some requests succeed until inventory is depleted, then all subsequent requests fail with "insufficient stock" - no negative inventory values.

---

## Monitoring After Deployment

Watch your logs for these patterns:

```
✅ Normal operation:
"Atomically decrementing inventory"
"Successfully decremented inventory for: [product]"
"Order created successfully"

⚠️ Expected during high load:
"Only X units of [product] available"
"Insufficient stock for [product]"

❌ Should NEVER see:
"weekly_amount_remaining = -1" (or any negative number)
Multiple successful orders exceeding weekly_cap
```

---

## Success Criteria

- [ ] Only one order succeeds when inventory is insufficient
- [ ] Inventory never goes negative
- [ ] Error messages are clear and helpful
- [ ] Failed orders don't charge the customer
- [ ] Inventory is restored if order creation fails
- [ ] Multiple items in one order decrement correctly
- [ ] System handles 100+ concurrent requests without overselling

---

## Troubleshooting

**If both orders succeed:**
- Check that the migration was applied correctly
- Verify the RPC functions exist in your database
- Check logs for "Atomically decrementing inventory" messages
- Ensure you're using `supabaseServer` (service role) not `supabase`

**If both orders fail:**
- Check that inventory > 0 before testing
- Verify order window is open
- Check Stripe configuration
- Review application logs for errors

**If orders succeed but inventory isn't decremented:**
- Check that the webhook is being called
- Verify webhook signature/secret is correct
- Check for errors in webhook processing logs
