import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('==> Starting Euroshub Kitchen Production Database Seeding...');

  // Ensure clean state for transactional & menu data
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.productAddonLink.deleteMany();
  await prisma.productAddon.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.socialLink.deleteMany();

  // 1. Seed Restaurant Settings (Singleton)
  console.log('--> Seeding Restaurant Settings (Rawalpindi Identity)...');
  const standardHours = {
    monday: { open: '09:00', close: '12:00', closed: false },
    tuesday: { open: '09:00', close: '12:00', closed: false },
    wednesday: { open: '09:00', close: '12:00', closed: false },
    thursday: { open: '09:00', close: '12:00', closed: false },
    friday: { open: '09:00', close: '12:00', closed: false },
    saturday: { open: '09:00', close: '12:00', closed: false },
    sunday: { open: '09:00', close: '12:00', closed: false },
  };

  await prisma.restaurantSettings.upsert({
    where: { id: 'singleton' },
    update: {
      name: 'Euroshub Kitchen',
      headline: 'Fresh, Hot & Fast in Rawalpindi',
      subtitle: 'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
      description:
        'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.',
      phone: '+92 xxx xxx xxx (Needs Admin Input)',
      email: 'haider1.euroshub@gmail.com',
      address: 'Kohistan Tower, Saddar, Rawalpindi, Office 609',
      openingHours: standardHours,
      deliveryEnabled: false,
      deliveryFee: 0,
      tableCount: 100,
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      footerText: '© Euroshub Kitchen. Fresh Pakistani Fast-Food. Kohistan Tower, Saddar, Rawalpindi.',
    },
    create: {
      id: 'singleton',
      name: 'Euroshub Kitchen',
      headline: 'Fresh, Hot & Fast in Rawalpindi',
      subtitle: 'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
      description:
        'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.',
      phone: '+92 xxx xxx xxx (Needs Admin Input)',
      email: 'haider1.euroshub@gmail.com',
      address: 'Kohistan Tower, Saddar, Rawalpindi, Office 609',
      openingHours: standardHours,
      deliveryEnabled: false,
      deliveryFee: 0,
      tableCount: 100,
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      footerText: '© Euroshub Kitchen. Fresh Pakistani Fast-Food. Kohistan Tower, Saddar, Rawalpindi.',
    },
  });

  // 2. Seed 100 Tables (01 to 100)
  console.log('--> Seeding 100 Restaurant Tables (01–100)...');
  const tableData = [];
  for (let i = 1; i <= 100; i++) {
    const tableNumber = i < 10 ? `0${i}` : `${i}`;
    tableData.push({
      tableNumber,
      capacity: 4,
      isActive: true,
    });
  }
  for (const t of tableData) {
    await prisma.restaurantTable.create({ data: t });
  }

  // 3. Seed Social Links (Inactive until Admin sets real handles)
  console.log('--> Seeding Social Link Placeholders...');
  const socialPlatforms = [
    { platform: 'FACEBOOK', url: '' },
    { platform: 'INSTAGRAM', url: '' },
    { platform: 'TIKTOK', url: '' },
    { platform: 'WHATSAPP', url: '' },
  ];
  for (const s of socialPlatforms) {
    await prisma.socialLink.create({
      data: {
        platform: s.platform,
        url: s.url,
        isActive: false, // Inactive by default so no fake social icons render
      },
    });
  }

  // 4. Seed Admin User
  console.log('--> Seeding Bootstrap Admin User...');
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'AdminPassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@euroshubkitchen.com' },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN, name: 'Euroshub Admin' },
    create: {
      email: 'admin@euroshubkitchen.com',
      passwordHash: adminPasswordHash,
      name: 'Euroshub Admin',
      phone: '+92 300 1234567',
      role: Role.ADMIN,
    },
  });

  // 5. Seed Menu Categories
  console.log('--> Seeding Fast-Food Categories...');
  const catPizza = await prisma.menuCategory.create({
    data: { name: 'Pizza', sortOrder: 1 },
  });
  const catBurgers = await prisma.menuCategory.create({
    data: { name: 'Burgers', sortOrder: 2 },
  });
  const catSandwiches = await prisma.menuCategory.create({
    data: { name: 'Sandwiches', sortOrder: 3 },
  });
  const catSides = await prisma.menuCategory.create({
    data: { name: 'Sides & Extras', sortOrder: 4 },
  });

  // 6. Seed Exactly 12 Menu Items & Variants with Section 1.3 Exact Pricing
  console.log('--> Seeding Exactly 12 Menu Items & Accurate Variants...');

  // Category: Pizza
  // 1. BBQ Pizza
  await prisma.menuItem.create({
    data: {
      name: 'BBQ Pizza',
      description: 'Fresh-baked pizza topped with smoky BBQ chicken, diced red onions, and melted mozzarella cheese.',
      price: 700,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Pizza Dough', 'BBQ Chicken', 'BBQ Sauce', 'Mozzarella', 'Red Onions'],
      tags: ['pizza', 'bbq', 'chicken'],
      isAvailable: true,
      categoryId: catPizza.id,
      sortOrder: 1,
      variants: {
        create: [
          { name: 'Small', price: 700, sortOrder: 1 },
          { name: 'Medium', price: 1300, sortOrder: 2 },
          { name: 'Large', price: 2000, sortOrder: 3 },
          { name: 'Family', price: 3000, sortOrder: 4 },
        ],
      },
    },
  });

  // 2. Hot & Spicy Pizza
  await prisma.menuItem.create({
    data: {
      name: 'Hot & Spicy Pizza',
      description: 'Spicy chicken pizza topped with green chillies, jalapeños, onions, and our special spicy chili sauce.',
      price: 700,
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Pizza Dough', 'Spicy Chicken', 'Jalapeños', 'Green Chillies', 'Mozzarella', 'Spicy Tomato Sauce'],
      tags: ['pizza', 'spicy', 'hot'],
      isAvailable: true,
      categoryId: catPizza.id,
      sortOrder: 2,
      variants: {
        create: [
          { name: 'Small', price: 700, sortOrder: 1 },
          { name: 'Medium', price: 1300, sortOrder: 2 },
          { name: 'Large', price: 2000, sortOrder: 3 },
          { name: 'Family', price: 3000, sortOrder: 4 },
        ],
      },
    },
  });

  // 3. Crown Crust Pizza (ONLY 3 SIZES)
  await prisma.menuItem.create({
    data: {
      name: 'Crown Crust Pizza',
      description: 'Signature pizza with an artisanal stuffed crown crust, tender spiced chicken cubes, and rich mozzarella.',
      price: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Crown Crust Dough', 'Cream Cheese Pockets', 'Marinated Chicken', 'Mozzarella', 'Olives'],
      tags: ['pizza', 'crown-crust', 'signature'],
      isAvailable: true,
      categoryId: catPizza.id,
      sortOrder: 3,
      variants: {
        create: [
          { name: 'Small', price: 1500, sortOrder: 1 },
          { name: 'Medium', price: 2500, sortOrder: 2 },
          { name: 'Large', price: 3500, sortOrder: 3 },
        ],
      },
    },
  });

  // 4. Cheezy Pizza
  await prisma.menuItem.create({
    data: {
      name: 'Cheezy Pizza',
      description: 'Loaded golden blend of mozzarella and cheddar cheese over seasoned herb tomato sauce.',
      price: 700,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Pizza Dough', 'Mozzarella Cheese', 'Cheddar Cheese', 'Herb Tomato Sauce'],
      tags: ['pizza', 'cheese', 'vegetarian'],
      isAvailable: true,
      categoryId: catPizza.id,
      sortOrder: 4,
      variants: {
        create: [
          { name: 'Small', price: 700, sortOrder: 1 },
          { name: 'Medium', price: 1200, sortOrder: 2 },
          { name: 'Large', price: 2000, sortOrder: 3 },
          { name: 'Family', price: 3000, sortOrder: 4 },
        ],
      },
    },
  });

  // 5. Vegetable Pizza
  await prisma.menuItem.create({
    data: {
      name: 'Vegetable Pizza',
      description: 'Fresh vegetarian pizza topped with crisp bell peppers, onions, mushrooms, olives, sweet corn, and mozzarella.',
      price: 600,
      imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Pizza Dough', 'Bell Peppers', 'Red Onions', 'Mushrooms', 'Black Olives', 'Sweet Corn', 'Mozzarella'],
      tags: ['pizza', 'vegetarian', 'fresh'],
      isAvailable: true,
      categoryId: catPizza.id,
      sortOrder: 5,
      variants: {
        create: [
          { name: 'Small', price: 600, sortOrder: 1 },
          { name: 'Medium', price: 1000, sortOrder: 2 },
          { name: 'Large', price: 1800, sortOrder: 3 },
          { name: 'Family', price: 2500, sortOrder: 4 },
        ],
      },
    },
  });

  // Category: Burgers
  // 6. Reggy Burger
  await prisma.menuItem.create({
    data: {
      name: 'Reggy Burger',
      description: 'Classic grilled patty burger with crisp lettuce, sliced tomato, onions, and house burger dressing in a toasted bun.',
      price: 400,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Toasted Bun', 'Seasoned Patty', 'Iceberg Lettuce', 'Tomato', 'House Sauce'],
      tags: ['burger', 'classic', 'patty'],
      isAvailable: true,
      categoryId: catBurgers.id,
      sortOrder: 6,
      variants: {
        create: [
          { name: 'Single', price: 400, sortOrder: 1 },
          { name: 'Double', price: 650, sortOrder: 2 },
          { name: 'Triple / Monster', price: 900, sortOrder: 3 },
        ],
      },
    },
  });

  // 7. Bazinga Burger
  await prisma.menuItem.create({
    data: {
      name: 'Bazinga Burger',
      description: 'Crispy zinger-style fried chicken fillet coated in spicy seasoning, topped with crunchy slaw and spicy mayo.',
      price: 900,
      imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Brioche Bun', 'Crispy Fried Chicken Fillet', 'Spicy Mayo', 'Crispy Slaw'],
      tags: ['burger', 'crispy', 'chicken', 'zinger'],
      isAvailable: true,
      categoryId: catBurgers.id,
      sortOrder: 7,
      variants: {
        create: [{ name: 'Regular', price: 900, sortOrder: 1 }],
      },
    },
  });

  // Category: Sandwiches
  // 8. Euro Sandwich
  await prisma.menuItem.create({
    data: {
      name: 'Euro Sandwich',
      description: 'Multi-layer toasted club sandwich packed with grilled chicken strips, cheese, fresh greens, and house dressing.',
      price: 900,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Toasted White Bread', 'Grilled Chicken', 'Cheese', 'Iceberg Lettuce', 'Sandwich Mayo'],
      tags: ['sandwich', 'club', 'chicken'],
      isAvailable: true,
      categoryId: catSandwiches.id,
      sortOrder: 8,
      variants: {
        create: [{ name: 'Regular', price: 900, sortOrder: 1 }],
      },
    },
  });

  // 9. Mexican Sandwich
  await prisma.menuItem.create({
    data: {
      name: 'Mexican Sandwich',
      description: 'Spiced Mexican grilled chicken sandwich with sliced jalapeños, zesty tomato salsa, and melted cheese.',
      price: 900,
      imageUrl: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Toasted Bread', 'Fajita Spiced Chicken', 'Jalapeños', 'Salsa', 'Melted Cheese'],
      tags: ['sandwich', 'mexican', 'spicy'],
      isAvailable: true,
      categoryId: catSandwiches.id,
      sortOrder: 9,
      variants: {
        create: [{ name: 'Regular', price: 900, sortOrder: 1 }],
      },
    },
  });

  // Category: Sides & Extras
  // 10. Mayo Dip
  await prisma.menuItem.create({
    data: {
      name: 'Mayo Dip',
      description: 'Creamy house-made garlic mayo dipping sauce, ideal for fries and pizza crusts.',
      price: 60,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Mayonnaise', 'Garlic', 'Spices'],
      tags: ['side', 'dip', 'sauce'],
      isAvailable: true,
      categoryId: catSides.id,
      sortOrder: 10,
      variants: {
        create: [{ name: 'Standard', price: 60, sortOrder: 1 }],
      },
    },
  });

  // 11. Water Bottle
  await prisma.menuItem.create({
    data: {
      name: 'Water Bottle',
      description: 'Chilled 500ml purified mineral drinking water.',
      price: 50,
      imageUrl: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Mineral Water 500ml'],
      tags: ['beverage', 'water'],
      isAvailable: true,
      categoryId: catSides.id,
      sortOrder: 11,
      variants: {
        create: [{ name: '500ml', price: 50, sortOrder: 1 }],
      },
    },
  });

  // 12. Fries
  await prisma.menuItem.create({
    data: {
      name: 'Fries',
      description: 'Golden crispy potato french fries served hot and lightly seasoned with salt.',
      price: 200,
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
      ingredients: ['Potatoes', 'Vegetable Oil', 'Fine Salt'],
      tags: ['side', 'fries', 'crispy'],
      isAvailable: true,
      categoryId: catSides.id,
      sortOrder: 12,
      variants: {
        create: [{ name: 'Regular', price: 200, sortOrder: 1 }],
      },
    },
  });

  console.log('==> Euroshub Kitchen Database Seeding Successfully Completed!');
  console.log('    - Admin: admin@euroshubkitchen.com / AdminPassword123!');
  console.log('    - Categories: 4 (Pizza, Burgers, Sandwiches, Sides & Extras)');
  console.log('    - Menu Items: 12 exact fast-food products with PKR variants');
  console.log('    - Tables: 100 active tables (01 to 100)');
  console.log('    - Zero fake reviews, fake orders, or fake customers seeded.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
