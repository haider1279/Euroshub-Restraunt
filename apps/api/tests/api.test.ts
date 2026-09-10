import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

let adminToken: string;
let customerToken: string;
let customer2Token: string;
let customerId: string;
let customer2Id: string;
let availableMenuItemId: string;
let unavailableMenuItemId: string;
let completedOrderId: string;
let pendingOrderId: string;

describe('Euroshub Kitchen API Comprehensive Test Suite', () => {
  beforeAll(async () => {
    // 1. Authenticate seeded Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'AdminPassword123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;

    // 2. Register or Login Customer 1
    let custRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testcust1@euroshubkitchen.com', password: 'Customer123!' });
    if (custRes.status !== 200) {
      custRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testcust1@euroshubkitchen.com',
          password: 'Customer123!',
          name: 'Test Customer One',
          phone: '0300-1111111',
        });
    }
    expect([200, 201]).toContain(custRes.status);
    customerToken = custRes.body.accessToken;
    customerId = custRes.body.user.id;

    // 3. Register or Login Customer 2
    let cust2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testcust2@euroshubkitchen.com', password: 'Customer123!' });
    if (cust2Res.status !== 200) {
      cust2Res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testcust2@euroshubkitchen.com',
          password: 'Customer123!',
          name: 'Test Customer Two',
          phone: '0300-2222222',
        });
    }
    expect([200, 201]).toContain(cust2Res.status);
    customer2Token = cust2Res.body.accessToken;
    customer2Id = cust2Res.body.user.id;

    // 4. Fetch menu items to find available and unavailable items
    const menuRes = await request(app).get('/api/admin/menu-items').set('Authorization', `Bearer ${adminToken}`);
    expect(menuRes.status).toBe(200);
    const available = menuRes.body.items.find((i: any) => i.isAvailable === true);
    expect(available).toBeDefined();
    availableMenuItemId = available.id;

    let unavailable = menuRes.body.items.find((i: any) => i.isAvailable === false);
    if (!unavailable) {
      const categoryId = menuRes.body.items[0].categoryId;
      const createdItemRes = await request(app)
        .post('/api/admin/menu-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Seasonal Special (Sold Out)',
          description: 'Limited seasonal fast-food item.',
          price: 550,
          categoryId,
          isAvailable: false,
        });
      unavailableMenuItemId = createdItemRes.body.item.id;
    } else {
      unavailableMenuItemId = unavailable.id;
    }

    // 5. Create an initial completed order for Customer 1
    const initialOrderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        type: 'TAKEAWAY',
        items: [{ menuItemId: availableMenuItemId, quantity: 1 }],
        contactPhone: '0300-1111111',
      });
    expect(initialOrderRes.status).toBe(201);
    completedOrderId = initialOrderRes.body.order.id;

    // Advance to COMPLETED through valid transitions
    await request(app)
      .patch(`/api/admin/orders/${completedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    await request(app)
      .patch(`/api/admin/orders/${completedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PREPARING' });
    await request(app)
      .patch(`/api/admin/orders/${completedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'READY' });
    await request(app)
      .patch(`/api/admin/orders/${completedOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COMPLETED' });
  });

  // ==========================================
  // 1. AUTHENTICATION & VALIDATION
  // ==========================================
  describe('Authentication & Validation', () => {
    it('rejects registration with weak password (missing number)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'weakpassword@example.com',
        password: 'onlyletters',
        name: 'Weak Pass',
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with duplicate email address', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'testcust1@euroshubkitchen.com', // already registered
        password: 'Password123!',
        name: 'Test Duplicate',
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('rejects login with bad credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@euroshubkitchen.com',
        password: 'WrongPassword999!',
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects protected customer routes without token', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================
  // 2. AUTHORIZATION & ROLE ISOLATION
  // ==========================================
  describe('Authorization & Role Isolation', () => {
    it('blocks customer tokens from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks customer from viewing another customer order', async () => {
      // Fetch customer 1's order
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      const order1 = ordersRes.body.orders[0];

      // Attempt to access with Customer 2's token
      const res = await request(app)
        .get(`/api/orders/${order1.id}`)
        .set('Authorization', `Bearer ${customer2Token}`);
      expect(res.status).toBe(404); // returns 404 to avoid leaking existence
    });

    it('allows admin to view any order', async () => {
      const ordersRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      const order1 = ordersRes.body.orders[0];

      const res = await request(app)
        .get(`/api/orders/${order1.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.order.id).toBe(order1.id);
    });
  });

  // ==========================================
  // 3. ORDER CREATION & SERVER RE-PRICING
  // ==========================================
  describe('Order Creation & Pricing Enforcement', () => {
    it('rejects order containing an unavailable menu item', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          type: 'DINE_IN',
          items: [{ menuItemId: unavailableMenuItemId, quantity: 1 }],
          contactPhone: '0300-1234567',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ITEM_UNAVAILABLE');
    });

    it('computes order total from database price ignoring manipulated client totals', async () => {
      // Get actual price from DB
      const itemRes = await request(app).get(`/api/menu-items/${availableMenuItemId}`);
      const realPrice = Number(itemRes.body.item.price);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          type: 'TAKEAWAY',
          items: [{ menuItemId: availableMenuItemId, quantity: 2 }],
          contactPhone: '0300-1234567',
          // Maliciously submitted client values that should be ignored:
          subtotal: 1.0,
          total: 1.0,
        });

      expect(res.status).toBe(201);
      const created = res.body.order;
      pendingOrderId = created.id;

      // Verify subtotal matches realPrice * 2
      expect(Number(created.subtotal)).toBeCloseTo(realPrice * 2, 2);
      expect(Number(created.total)).toBeCloseTo(realPrice * 2, 2);
      expect(created.status).toBe('PENDING');
      expect(created.orderNumber).toMatch(/^EK-\d{8}-\d{4}$/);
      expect(created.items[0].nameAtPurchase).toBe(itemRes.body.item.name);
      expect(Number(created.items[0].priceAtPurchase)).toBeCloseTo(realPrice, 2);
    });

    it('enforces delivery gating when delivery service is disabled', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          type: 'DELIVERY',
          items: [{ menuItemId: availableMenuItemId, quantity: 1 }],
          contactPhone: '0300-1234567',
          deliveryAddress: 'Main Mall Road, Rawalpindi',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DELIVERY_DISABLED');
    });
  });

  // ==========================================
  // 4. ORDER STATUS TRANSITIONS (STATE MACHINE)
  // ==========================================
  describe('Order Status State Machine Transitions', () => {
    it('rejects invalid jump from PENDING directly to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('advances through valid sequential state transitions: PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED', async () => {
      // 1. PENDING -> CONFIRMED
      const res1 = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });
      expect(res1.status).toBe(200);
      expect(res1.body.order.status).toBe('CONFIRMED');

      // 2. CONFIRMED -> PREPARING
      const res2 = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PREPARING' });
      expect(res2.status).toBe(200);
      expect(res2.body.order.status).toBe('PREPARING');

      // 3. PREPARING -> READY
      const res3 = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'READY' });
      expect(res3.status).toBe(200);
      expect(res3.body.order.status).toBe('READY');

      // 4. READY -> COMPLETED
      const res4 = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });
      expect(res4.status).toBe(200);
      expect(res4.body.order.status).toBe('COMPLETED');
    });

    it('rejects transitions once an order has reached terminal COMPLETED state', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${pendingOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // ==========================================
  // 5. RESERVATION VALIDATION & CAPACITY
  // ==========================================
  describe('Reservation Rules & Capacity Checks', () => {
    it('rejects reservation dates in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: pastDate,
          partySize: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_RESERVATION');
      expect(res.body.error.message).toContain('past');
    });

    it('rejects reservation requests outside restaurant operating hours', async () => {
      // Set time to 04:00 AM tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(4, 0, 0, 0);

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: tomorrow.toISOString(),
          partySize: 2,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_RESERVATION');
      expect(res.body.error.message).toContain('accepted between');
    });

    it('accepts valid reservation and creates it with status PENDING', async () => {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 3);
      validDate.setHours(10, 0, 0, 0); // 10:00 AM, within 09:00 - 12:00

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: validDate.toISOString(),
          partySize: 4,
          notes: 'Special table request.',
        });

      expect(res.status).toBe(201);
      expect(res.body.reservation.status).toBe('PENDING');
      expect(res.body.reservation.partySize).toBe(4);
    });
  });

  // ==========================================
  // 6. REVIEW RULES & MODERATION
  // ==========================================
  describe('Review Rules & Moderation', () => {
    it('rejects review on order not owned by the requesting customer', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          orderId: completedOrderId, // owned by Customer 1
          rating: 5,
          comment: 'Trying to review another user order.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('REVIEW_NOT_PERMITTED');
    });

    it('allows review on customer own completed order', async () => {
      // Customer 1 reviewing pendingOrderId which we completed in the test above
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: pendingOrderId,
          rating: 5,
          comment: 'Fantastic fast-food! Hot, fresh and tasty.',
        });

      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);
      expect(res.body.review.isHidden).toBe(false);
    });

    it('rejects duplicate review on the same order', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: pendingOrderId,
          rating: 4,
          comment: 'Second review attempt on same order.',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REVIEW_NOT_PERMITTED');
    });

    it('allows admin to hide and restore reviews', async () => {
      const adminReviewsRes = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminReviewsRes.status).toBe(200);

      const reviewToModerate = adminReviewsRes.body.reviews[0];

      // Hide review
      const hideRes = await request(app)
        .patch(`/api/admin/reviews/${reviewToModerate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isHidden: true });
      expect(hideRes.status).toBe(200);
      expect(hideRes.body.review.isHidden).toBe(true);

      // Restore review
      const restoreRes = await request(app)
        .patch(`/api/admin/reviews/${reviewToModerate.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isHidden: false });
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.review.isHidden).toBe(false);
    });
  });
});
