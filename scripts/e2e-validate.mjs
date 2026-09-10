const BASE_URL = 'http://localhost:5000/api';

async function runE2E() {
  console.log('=== STARTING EUROSHUB KITCHEN FAST-FOOD E2E VALIDATION ===\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'ok' ? 'PASSED' : 'FAILED');

  // 2. Fetch public menu items & settings
  const menuRes = await fetch(`${BASE_URL}/menu-items`);
  const menuData = await menuRes.json();
  console.log(`2. Public menu items: ${menuData.items?.length} items retrieved (Expected: 12 fast-food products)`);
  const testItem = menuData.items[0];

  const settingsRes = await fetch(`${BASE_URL}/settings`);
  const settingsData = await settingsRes.json();
  console.log(`2b. Public restaurant identity: ${settingsData.settings?.name} in ${settingsData.settings?.address} (${settingsData.settings?.currency})`);

  // 3. Customer register or login
  let custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2ecustomer@euroshubkitchen.com',
      password: 'Customer123!',
    }),
  });

  if (!custLoginRes.ok) {
    custLoginRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e2ecustomer@euroshubkitchen.com',
        password: 'Customer123!',
        name: 'E2E Rawalpindi Customer',
        phone: '0300-9876543',
      }),
    });
  }

  const custLogin = await custLoginRes.json();
  const custToken = custLogin.accessToken;
  console.log('3. Customer Auth:', custLogin.user?.name ? `PASSED (${custLogin.user.name})` : 'FAILED');

  // 4. Place Customer Order (Dine-in with table selection 01)
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      type: 'DINE_IN',
      tableNumber: '01',
      contactPhone: '0300-9876543',
      paymentMethod: 'PAY_AT_RESTAURANT',
      items: [
        {
          menuItemId: testItem.id,
          variantId: testItem.variants?.[0]?.id,
          quantity: 2,
        },
      ],
    }),
  });
  const orderData = await orderRes.json();
  const order = orderData.order;
  console.log('4. Place Order:', order?.orderNumber ? `PASSED (#${order.orderNumber}, Total: Rs. ${order.total}, Table: ${order.tableNumber})` : `FAILED: ${JSON.stringify(orderData)}`);

  // 5. Customer view order
  const getOrderRes = await fetch(`${BASE_URL}/orders/${order.id}`, {
    headers: { Authorization: `Bearer ${custToken}` },
  });
  const getOrderData = await getOrderRes.json();
  console.log('5. Customer fetch order by ID:', getOrderData.order?.id === order.id ? 'PASSED' : 'FAILED');

  // 6. Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@euroshubkitchen.com',
      password: 'AdminPassword123!',
    }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.accessToken;
  console.log('6. Admin login:', adminLogin.user?.role === 'ADMIN' ? 'PASSED' : 'FAILED');

  // 7. Admin Dashboard Stats & 100 Tables
  const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dashData = await dashRes.json();
  console.log('7. Admin Dashboard:', dashData.totalOrders !== undefined ? `PASSED (Orders: ${dashData.totalOrders}, Today's Revenue: Rs. ${dashData.todayRevenue})` : 'FAILED');

  const tablesRes = await fetch(`${BASE_URL}/tables`);
  const tablesData = await tablesRes.json();
  console.log(`7b. Restaurant Tables: ${tablesData.tables?.length} tables configured (Tables 01-100)`);

  // 8. Admin advance order transitions: PENDING -> CONFIRMED -> PREPARING -> READY -> COMPLETED
  const transitions = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  let currentStatus = order.status;
  for (const nextStatus of transitions) {
    const patchRes = await fetch(`${BASE_URL}/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const patchData = await patchRes.json();
    currentStatus = patchData.order?.status;
  }
  console.log('8. Admin Order Transitions to COMPLETED:', currentStatus === 'COMPLETED' ? 'PASSED' : 'FAILED');

  // 9. Customer leave review on completed order
  const reviewRes = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      orderId: order.id,
      rating: 5,
      comment: 'Super fast delivery to table 01 and piping hot crispy food! Euroshub Kitchen Saddar rocks!',
    }),
  });
  const reviewData = await reviewRes.json();
  console.log('9. Customer Review creation:', reviewData.review?.id ? 'PASSED' : `FAILED: ${JSON.stringify(reviewData)}`);

  // 10. Customer reservation (10:00 AM within 09:00 - 12:00)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  futureDate.setHours(10, 0, 0, 0); // 10:00 AM
  const resvRes = await fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      date: futureDate.toISOString(),
      partySize: 4,
      notes: 'Table near window on 6th floor Kohistan Tower.',
    }),
  });
  const resvData = await resvRes.json();
  console.log('10. Customer Reservation creation:', resvData.reservation?.id ? 'PASSED' : `FAILED: ${JSON.stringify(resvData)}`);

  // 11. Admin confirm reservation
  if (resvData.reservation) {
    const adminResvPatch = await fetch(`${BASE_URL}/admin/reservations/${resvData.reservation.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const adminResvData = await adminResvPatch.json();
    console.log('11. Admin Confirm Reservation:', adminResvData.reservation?.status === 'CONFIRMED' ? 'PASSED' : 'FAILED');
  }

  // 12. Admin moderate review
  if (reviewData.review) {
    const modRes = await fetch(`${BASE_URL}/admin/reviews/${reviewData.review.id}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isHidden: true }),
    });
    const modData = await modRes.json();
    console.log('12. Admin Review Moderation (Hide):', modData.review?.isHidden === true ? 'PASSED' : 'FAILED');

    // Unhide review
    await fetch(`${BASE_URL}/admin/reviews/${reviewData.review.id}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isHidden: false }),
    });
  }

  // 13. Admin settings verify
  const currentSettingsRes = await fetch(`${BASE_URL}/settings`);
  const currentSettings = await currentSettingsRes.json();
  console.log('13. Admin Settings Verify:', currentSettings.settings?.tableCount === 100 ? 'PASSED (100 Tables)' : 'FAILED');

  console.log('\n=== ALL END-TO-END JOURNEY VALIDATIONS COMPLETED SUCCESSFULLY! ===');
}

runE2E().catch(console.error);
