"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('==> Starting Euroshub Kitchen Database Seeding...');
    // Ensure idempotency: clean up existing transactional data
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.reservation.deleteMany();
    // 1. Seed Restaurant Settings (Singleton)
    console.log('--> Seeding Restaurant Settings...');
    const settings = await prisma.restaurantSettings.upsert({
        where: { id: 'singleton' },
        update: {
            name: 'Euroshub Kitchen',
            description: 'An authentic European bistro celebrating artisanal traditions, wood-fired hearth cooking, hand-made pasta, and sustainably sourced ingredients paired with fine regional wines.',
            phone: '+1 (555) 387-6748',
            email: 'contact@euroshubkitchen.com',
            address: '42 Boulevard Saint-Michel, Grand Plaza, Suite 100',
            openingHours: {
                monday: { open: '11:30', close: '22:30', closed: false },
                tuesday: { open: '11:30', close: '22:30', closed: false },
                wednesday: { open: '11:30', close: '22:30', closed: false },
                thursday: { open: '11:30', close: '23:00', closed: false },
                friday: { open: '11:30', close: '23:30', closed: false },
                saturday: { open: '11:00', close: '23:30', closed: false },
                sunday: { open: '11:00', close: '22:00', closed: false },
            },
            deliveryEnabled: true,
            deliveryFee: 2.5,
            tableCount: 20,
        },
        create: {
            id: 'singleton',
            name: 'Euroshub Kitchen',
            description: 'An authentic European bistro celebrating artisanal traditions, wood-fired hearth cooking, hand-made pasta, and sustainably sourced ingredients paired with fine regional wines.',
            phone: '+1 (555) 387-6748',
            email: 'contact@euroshubkitchen.com',
            address: '42 Boulevard Saint-Michel, Grand Plaza, Suite 100',
            openingHours: {
                monday: { open: '11:30', close: '22:30', closed: false },
                tuesday: { open: '11:30', close: '22:30', closed: false },
                wednesday: { open: '11:30', close: '22:30', closed: false },
                thursday: { open: '11:30', close: '23:00', closed: false },
                friday: { open: '11:30', close: '23:30', closed: false },
                saturday: { open: '11:00', close: '23:30', closed: false },
                sunday: { open: '11:00', close: '22:00', closed: false },
            },
            deliveryEnabled: true,
            deliveryFee: 2.5,
            tableCount: 20,
        },
    });
    // 2. Seed Users (1 Admin + 4 Sample Customers)
    console.log('--> Seeding Users...');
    const adminPasswordHash = await bcryptjs_1.default.hash('AdminPassword123!', 10);
    const customerPasswordHash = await bcryptjs_1.default.hash('Customer123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@euroshubkitchen.com' },
        update: { passwordHash: adminPasswordHash, role: client_1.Role.ADMIN },
        create: {
            email: 'admin@euroshubkitchen.com',
            passwordHash: adminPasswordHash,
            name: 'Chef Antoine Laurent',
            phone: '+1 (555) 019-2834',
            role: client_1.Role.ADMIN,
        },
    });
    const customer1 = await prisma.user.upsert({
        where: { email: 'marco.rossi@example.com' },
        update: { passwordHash: customerPasswordHash },
        create: {
            email: 'marco.rossi@example.com',
            passwordHash: customerPasswordHash,
            name: 'Marco Rossi',
            phone: '+1 (555) 234-5678',
            role: client_1.Role.CUSTOMER,
        },
    });
    const customer2 = await prisma.user.upsert({
        where: { email: 'sophie.laurent@example.com' },
        update: { passwordHash: customerPasswordHash },
        create: {
            email: 'sophie.laurent@example.com',
            passwordHash: customerPasswordHash,
            name: 'Sophie Laurent',
            phone: '+1 (555) 345-6789',
            role: client_1.Role.CUSTOMER,
        },
    });
    const customer3 = await prisma.user.upsert({
        where: { email: 'alex.schmidt@example.com' },
        update: { passwordHash: customerPasswordHash },
        create: {
            email: 'alex.schmidt@example.com',
            passwordHash: customerPasswordHash,
            name: 'Alexander Schmidt',
            phone: '+1 (555) 456-7890',
            role: client_1.Role.CUSTOMER,
        },
    });
    const customer4 = await prisma.user.upsert({
        where: { email: 'elena.vassiliou@example.com' },
        update: { passwordHash: customerPasswordHash },
        create: {
            email: 'elena.vassiliou@example.com',
            passwordHash: customerPasswordHash,
            name: 'Elena Vassiliou',
            phone: '+1 (555) 567-8901',
            role: client_1.Role.CUSTOMER,
        },
    });
    // 3. Seed Menu Categories (8 Categories)
    console.log('--> Seeding Menu Categories...');
    const categoryData = [
        { name: 'Starters', sortOrder: 1 },
        { name: 'Salads', sortOrder: 2 },
        { name: 'Pasta & Risotto', sortOrder: 3 },
        { name: 'Artisan Pizza', sortOrder: 4 },
        { name: 'Main Courses', sortOrder: 5 },
        { name: 'Gourmet Burgers', sortOrder: 6 },
        { name: 'Desserts', sortOrder: 7 },
        { name: 'Wines & Beverages', sortOrder: 8 },
    ];
    const categories = {};
    for (const cat of categoryData) {
        categories[cat.name] = await prisma.menuCategory.upsert({
            where: { name: cat.name },
            update: { sortOrder: cat.sortOrder },
            create: cat,
        });
    }
    // 4. Seed Menu Items (34 Dishes across all categories)
    console.log('--> Seeding 34+ Menu Items with European bistro culinary profiles...');
    const dishes = [
        // Starters
        {
            name: 'Truffle Burrata Bruschetta',
            description: 'Creamy Pugliese burrata on toasted rustic sourdough, heirloom tomatoes, white truffle oil, and aged balsamic glaze.',
            price: 14.5,
            imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23512?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Pugliese Burrata', 'Rustic Sourdough', 'Heirloom Tomatoes', 'White Truffle Oil', 'Aged Balsamic'],
            tags: ['Vegetarian', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Starters',
        },
        {
            name: 'Classic Beef Carpaccio',
            description: 'Thinly sliced prime beef tenderloin, baby wild arugula, shaved Parmigiano-Reggiano 24-month, crispy capers, and extra virgin olive oil.',
            price: 16.0,
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Prime Beef Tenderloin', 'Parmigiano-Reggiano', 'Arugula', 'Crispy Capers', 'Lemon Emulsion'],
            tags: ['Gluten-Free'],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Starters',
        },
        {
            name: 'Crispy Calamari Fritti',
            description: 'Tender Monterey squid lightly dusted in semolina flour, served with preserved lemon aioli and charred lemon wedges.',
            price: 15.0,
            imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Squid', 'Semolina Crust', 'Preserved Lemon Aioli', 'Fresh Parsley'],
            tags: [],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Starters',
        },
        {
            name: 'Smoked Salmon Crostini',
            description: 'Norwegian cold-smoked salmon, herb mascarpone, pickled shallots, fresh dill, and caper berries on toasted baguette.',
            price: 14.0,
            imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Norwegian Salmon', 'Whipped Mascarpone', 'Dill', 'Pickled Shallots', 'Caper Berries'],
            tags: [],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Starters',
        },
        // Salads
        {
            name: 'Euroshub Mediterranean Niçoise',
            description: 'Seared sashimi-grade yellowfin tuna, French green beans, soft-boiled quail eggs, fingerling potatoes, Kalamata olives, and dijon vinaigrette.',
            price: 18.5,
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Yellowfin Tuna', 'Quail Eggs', 'Fingerling Potatoes', 'Green Beans', 'Kalamata Olives', 'Dijon Dressing'],
            tags: ['Gluten-Free', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Salads',
        },
        {
            name: 'Roasted Beet & Goat Cheese Salad',
            description: 'Slow-roasted golden and red beets, whipped chèvre goat cheese, candied walnuts, baby spinach, and sherry vinaigrette.',
            price: 14.0,
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Roasted Beets', 'Chèvre Goat Cheese', 'Candied Walnuts', 'Baby Spinach', 'Sherry Vinaigrette'],
            tags: ['Vegetarian', 'Gluten-Free'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Salads',
        },
        {
            name: 'Tuscan Panzanella',
            description: 'Sun-ripened Roma tomatoes, rustic sourdough croutons, English cucumber, red onions, fresh basil, and red wine vinaigrette.',
            price: 13.0,
            imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Roma Tomatoes', 'Toasted Sourdough', 'Cucumbers', 'Fresh Basil', 'Red Wine Vinegar'],
            tags: ['Vegan'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Salads',
        },
        // Pasta & Risotto
        {
            name: 'Wild Mushroom Tagliatelle',
            description: 'House-made fresh egg tagliatelle, roasted chanterelle and porcini mushrooms, black truffle butter, and 24-month Parmigiano-Reggiano.',
            price: 22.0,
            imageUrl: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Fresh Tagliatelle', 'Chanterelle Mushrooms', 'Porcini', 'Black Truffle Butter', 'Parmigiano-Reggiano'],
            tags: ['Vegetarian', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Pasta & Risotto',
        },
        {
            name: 'Spaghetti alle Vongole',
            description: 'Bronze-die spaghetti tossed with fresh Manila clams, garlic, chili pepper, white wine, Italian flat-leaf parsley, and EVOO.',
            price: 24.5,
            imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Manila Clams', 'Bronze-Die Spaghetti', 'White Wine', 'Garlic', 'Chili Flakes', 'EVOO'],
            tags: [],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Pasta & Risotto',
        },
        {
            name: 'Slow-Cooked Bolognese Pappardelle',
            description: 'Rich ragù of prime beef, veal, and pancetta braised for 8 hours in Sangiovese wine and San Marzano tomatoes over wide ribbons of pasta.',
            price: 23.0,
            imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Handmade Pappardelle', 'Braised Beef & Veal', 'Pancetta', 'San Marzano Tomatoes', 'Parmigiano'],
            tags: [],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Pasta & Risotto',
        },
        {
            name: 'Saffron & Wild Prawn Risotto',
            description: 'Acquerello carnaroli rice, Spanish saffron threads, butter-poached Mediterranean wild prawns, and sweet green peas.',
            price: 26.0,
            imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Carnaroli Rice', 'Spanish Saffron', 'Wild Prawns', 'Sweet Peas', 'White Wine'],
            tags: ['Gluten-Free', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: false,
            categoryName: 'Pasta & Risotto',
        },
        {
            name: 'Ricotta & Spinach Ravioli',
            description: 'Handmade ravioli filled with fresh sheep milk ricotta and organic spinach, tossed in sage brown butter and toasted pine nuts.',
            price: 20.0,
            imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&w=800&q=80',
            ingredients: ['House Ravioli', 'Sheep Milk Ricotta', 'Spinach', 'Brown Butter', 'Crispy Sage', 'Pine Nuts'],
            tags: ['Vegetarian'],
            isAvailable: false,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Pasta & Risotto',
        },
        // Artisan Pizza
        {
            name: 'Margherita Verace',
            description: 'San Marzano D.O.P. tomatoes, fresh fior di latte mozzarella, fresh basil, sea salt, and extra virgin olive oil on 48-hour fermented dough.',
            price: 16.5,
            imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
            ingredients: ['San Marzano Tomatoes', 'Fior di Latte', 'Fresh Basil', 'EVOO'],
            tags: ['Vegetarian'],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Artisan Pizza',
        },
        {
            name: 'Prosciutto di Parma & Fig Pizza',
            description: 'White base with gorgonzola dolce, caramelized black mission figs, aged prosciutto di Parma, wild arugula, and wildflower honey drizzle.',
            price: 21.0,
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Prosciutto di Parma 24-Mo', 'Mission Figs', 'Gorgonzola Dolce', 'Arugula', 'Wild Honey'],
            tags: ["Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Artisan Pizza',
        },
        {
            name: 'Diavola Piccante',
            description: 'Spicy Calabrian soppressata, chili-infused organic honey, San Marzano sauce, smoked provolone, and fresh oregano.',
            price: 19.5,
            imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Calabrian Soppressata', 'Hot Honey', 'Smoked Provolone', 'San Marzano Sauce'],
            tags: [],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Artisan Pizza',
        },
        {
            name: 'Funghi & Truffle Cream Pizza',
            description: 'Roasted cremini and oyster mushrooms, fontina cheese, thyme, garlic confit, and black truffle cream base.',
            price: 20.0,
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Cremini & Oyster Mushrooms', 'Fontina', 'Truffle Cream', 'Garlic Confit', 'Fresh Thyme'],
            tags: ['Vegetarian'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Artisan Pizza',
        },
        // Main Courses
        {
            name: 'Slow-Braised Beef Short Rib',
            description: 'Bone-in prime beef short rib braised for 12 hours in Chianti Classico, served over creamy polenta with roasted glazed baby carrots.',
            price: 34.0,
            imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Prime Short Rib', 'Chianti Classico Red Wine', 'Creamy Polenta', 'Glazed Baby Carrots', 'Gremolata'],
            tags: ['Gluten-Free', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Main Courses',
        },
        {
            name: 'Pan-Roasted Mediterranean Sea Bass',
            description: 'Crisp-skinned European branzino fillet, sautéed heirloom baby zucchini, caperberry brown butter sauce, and herb-crusted potatoes.',
            price: 29.5,
            imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Branzino Sea Bass', 'Baby Zucchini', 'Caperberry Brown Butter', 'Fingerling Potatoes'],
            tags: ['Gluten-Free'],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Main Courses',
        },
        {
            name: 'Duck Confit à l’Orange',
            description: 'Crispy slow-cured Moulard duck leg, blood orange gastrique, parsnip purée, and buttered haricots verts.',
            price: 31.0,
            imageUrl: 'https://images.unsplash.com/photo-1514944298352-7360256860d5?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Moulard Duck Leg', 'Blood Orange Gastrique', 'Parsnip Purée', 'Haricots Verts'],
            tags: ['Gluten-Free'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Main Courses',
        },
        {
            name: 'Roasted Rack of Lamb Provençal',
            description: 'Herb-dijon crusted Colorado lamb chops, ratatouille tartlet, rosemary lamb jus, and garlic potato gratin.',
            price: 38.0,
            imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Rack of Lamb', 'Dijon-Herb Crust', 'Ratatouille', 'Garlic Potato Gratin', 'Rosemary Jus'],
            tags: ["Chef's Special"],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Main Courses',
        },
        {
            name: 'Tuscan Porchetta Steak',
            description: 'Crisp crackling rolled pork belly seasoned with wild fennel and garlic, served with charred broccolini and apple cider jus.',
            price: 27.0,
            imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Heritage Pork Belly', 'Wild Fennel', 'Charred Broccolini', 'Apple Cider Jus'],
            tags: [],
            isAvailable: false,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Main Courses',
        },
        // Gourmet Burgers
        {
            name: 'The Euroshub Truffle Wagyu Burger',
            description: 'Half-pound Australian Wagyu patty, black truffle aioli, melted Gruyère AOP, balsamic glazed caramelized onions, and brioche bun with herb frites.',
            price: 21.5,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Australian Wagyu Beef', 'Truffle Aioli', 'Gruyère AOP', 'Caramelized Onions', 'Brioche Bun'],
            tags: ['Popular'],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Gourmet Burgers',
        },
        {
            name: 'French Bistro Duck Burger',
            description: 'Ground confit duck patty, brie de Meaux, fig preserves, arugula, and rosemary shoestring fries.',
            price: 22.0,
            imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Confit Duck Meat', 'Brie de Meaux', 'Fig Preserves', 'Arugula', 'Shoestring Fries'],
            tags: ["Chef's Special"],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Gourmet Burgers',
        },
        {
            name: 'Artisan Portobello & Halloumi Burger',
            description: 'Grilled balsamic portobello cap, seared Cypriot halloumi cheese, roasted red peppers, pesto mayo, and sweet potato crisps.',
            price: 18.0,
            imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Portobello Mushroom', 'Cypriot Halloumi', 'Roasted Red Peppers', 'Pesto Mayo'],
            tags: ['Vegetarian'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Gourmet Burgers',
        },
        // Desserts
        {
            name: 'Tiramisù Tradizionale',
            description: 'Savoiardi ladyfingers soaked in Illy espresso and dark rum, layered with whipped mascarpone cream and dusted with Valrhona cocoa.',
            price: 10.5,
            imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Savoiardi Ladyfingers', 'Illy Espresso', 'Dark Rum', 'Mascarpone', 'Valrhona Cocoa'],
            tags: ['Vegetarian', 'Popular'],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Desserts',
        },
        {
            name: 'Madagascar Vanilla Crème Brûlée',
            description: 'Velvety baked vanilla bean custard topped with a fragile caramelized sugar crust, served with fresh raspberries.',
            price: 11.0,
            imageUrl: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Madagascar Vanilla Bean', 'Egg Yolks', 'Heavy Cream', 'Caramelized Sugar', 'Fresh Raspberries'],
            tags: ['Vegetarian', 'Gluten-Free'],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Desserts',
        },
        {
            name: 'Warm Valrhona Chocolate Fondant',
            description: 'Molten dark chocolate cake baked to order with a liquid ganache center, paired with Sicilian pistachio gelato.',
            price: 12.0,
            imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Valrhona 70% Dark Chocolate', 'French Butter', 'Pistachio Gelato'],
            tags: ['Vegetarian', "Chef's Special"],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Desserts',
        },
        {
            name: 'Lemon Ricotta Cannoli',
            description: 'Crisp hand-rolled pastry shells filled with sweet ricotta, candied Sicilian lemon peel, and dark chocolate chips.',
            price: 9.5,
            imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Pastry Shells', 'Sheep Ricotta', 'Sicilian Lemon Peel', 'Pistachios', 'Chocolate Chips'],
            tags: ['Vegetarian'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Desserts',
        },
        // Wines & Beverages
        {
            name: 'San Pellegrino Sparkling Mineral (750ml)',
            description: 'Naturally carbonated sparkling water from the Italian Alps, crisp and refreshing.',
            price: 6.0,
            imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Natural Mineral Water'],
            tags: ['Vegan', 'Gluten-Free'],
            isAvailable: true,
            isFeatured: false,
            isPopular: false,
            categoryName: 'Wines & Beverages',
        },
        {
            name: 'Chianti Classico Riserva 2019 (Glass)',
            description: 'Sangiovese blend from Tuscany with aromas of ripe cherries, violet, and delicate oak spice.',
            price: 15.0,
            imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Sangiovese Wine', 'Contains Sulfites'],
            tags: ['Vegan'],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Wines & Beverages',
        },
        {
            name: 'Sancerre Blanc Sauvignon 2021 (Glass)',
            description: 'Crisp Loire Valley white wine displaying flinty minerality, gooseberry, and vibrant citrus zest.',
            price: 16.5,
            imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Sauvignon Blanc Wine'],
            tags: ['Vegan'],
            isAvailable: true,
            isFeatured: false,
            isPopular: true,
            categoryName: 'Wines & Beverages',
        },
        {
            name: 'Rosemary Blood Orange Spritz (Mocktail)',
            description: 'Fresh blood orange juice, aromatic rosemary syrup, tonic water, and charred rosemary sprig.',
            price: 8.5,
            imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
            ingredients: ['Blood Orange Juice', 'Rosemary Syrup', 'Tonic', 'Fresh Mint'],
            tags: ['Vegan', 'Gluten-Free'],
            isAvailable: true,
            isFeatured: true,
            isPopular: true,
            categoryName: 'Wines & Beverages',
        },
    ];
    const createdMenuItems = {};
    for (const dish of dishes) {
        const category = categories[dish.categoryName];
        const item = await prisma.menuItem.upsert({
            where: { id: `dish-${dish.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
            update: {
                name: dish.name,
                description: dish.description,
                price: dish.price,
                imageUrl: dish.imageUrl,
                ingredients: dish.ingredients,
                tags: dish.tags,
                isAvailable: dish.isAvailable,
                isFeatured: dish.isFeatured,
                isPopular: dish.isPopular,
                categoryId: category.id,
            },
            create: {
                id: `dish-${dish.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                imageUrl: dish.imageUrl,
                ingredients: dish.ingredients,
                tags: dish.tags,
                isAvailable: dish.isAvailable,
                isFeatured: dish.isFeatured,
                isPopular: dish.isPopular,
                categoryId: category.id,
            },
        });
        createdMenuItems[dish.name] = item;
    }
    // 5. Seed Orders (12 realistic orders across various statuses and order types)
    console.log('--> Seeding Sample Orders...');
    const orderConfigs = [
        {
            orderNumber: 'EK-20260901-0001',
            customer: customer1,
            type: client_1.OrderType.DINE_IN,
            status: client_1.OrderStatus.COMPLETED,
            tableNumber: 4,
            items: [
                { dish: createdMenuItems['Truffle Burrata Bruschetta'], qty: 1 },
                { dish: createdMenuItems['Wild Mushroom Tagliatelle'], qty: 2 },
                { dish: createdMenuItems['Chianti Classico Riserva 2019 (Glass)'], qty: 2 },
            ],
            daysAgo: 7,
        },
        {
            orderNumber: 'EK-20260902-0002',
            customer: customer2,
            type: client_1.OrderType.DELIVERY,
            status: client_1.OrderStatus.COMPLETED,
            deliveryAddress: '74 Avenue Victor Hugo, Apt 4B',
            items: [
                { dish: createdMenuItems['Margherita Verace'], qty: 2 },
                { dish: createdMenuItems['Classic Beef Carpaccio'], qty: 1 },
                { dish: createdMenuItems['Tiramisù Tradizionale'], qty: 2 },
            ],
            daysAgo: 6,
        },
        {
            orderNumber: 'EK-20260903-0003',
            customer: customer3,
            type: client_1.OrderType.TAKEAWAY,
            status: client_1.OrderStatus.COMPLETED,
            items: [
                { dish: createdMenuItems['The Euroshub Truffle Wagyu Burger'], qty: 2 },
                { dish: createdMenuItems['San Pellegrino Sparkling Mineral (750ml)'], qty: 2 },
            ],
            daysAgo: 5,
        },
        {
            orderNumber: 'EK-20260904-0004',
            customer: customer1,
            type: client_1.OrderType.DINE_IN,
            status: client_1.OrderStatus.COMPLETED,
            tableNumber: 12,
            items: [
                { dish: createdMenuItems['Pan-Roasted Mediterranean Sea Bass'], qty: 2 },
                { dish: createdMenuItems['Euroshub Mediterranean Niçoise'], qty: 1 },
                { dish: createdMenuItems['Warm Valrhona Chocolate Fondant'], qty: 1 },
            ],
            daysAgo: 4,
        },
        {
            orderNumber: 'EK-20260905-0005',
            customer: customer4,
            type: client_1.OrderType.DELIVERY,
            status: client_1.OrderStatus.COMPLETED,
            deliveryAddress: '15 Rue de Rivoli, Floor 3',
            items: [
                { dish: createdMenuItems['Prosciutto di Parma & Fig Pizza'], qty: 1 },
                { dish: createdMenuItems['Diavola Piccante'], qty: 1 },
                { dish: createdMenuItems['Madagascar Vanilla Crème Brûlée'], qty: 2 },
            ],
            daysAgo: 3,
        },
        {
            orderNumber: 'EK-20260906-0006',
            customer: customer2,
            type: client_1.OrderType.DINE_IN,
            status: client_1.OrderStatus.READY,
            tableNumber: 7,
            items: [
                { dish: createdMenuItems['Slow-Braised Beef Short Rib'], qty: 2 },
                { dish: createdMenuItems['Saffron & Wild Prawn Risotto'], qty: 1 },
            ],
            daysAgo: 1,
        },
        {
            orderNumber: 'EK-20260907-0007',
            customer: customer3,
            type: client_1.OrderType.DELIVERY,
            status: client_1.OrderStatus.PREPARING,
            deliveryAddress: '88 Boulevard Voltaire, Flat 12',
            items: [
                { dish: createdMenuItems['The Euroshub Truffle Wagyu Burger'], qty: 1 },
                { dish: createdMenuItems['French Bistro Duck Burger'], qty: 1 },
            ],
            daysAgo: 0,
        },
        {
            orderNumber: 'EK-20260908-0008',
            customer: customer1,
            type: client_1.OrderType.TAKEAWAY,
            status: client_1.OrderStatus.CONFIRMED,
            items: [
                { dish: createdMenuItems['Wild Mushroom Tagliatelle'], qty: 1 },
                { dish: createdMenuItems['Spaghetti alle Vongole'], qty: 1 },
            ],
            daysAgo: 0,
        },
        {
            orderNumber: 'EK-20260908-0009',
            customer: customer4,
            type: client_1.OrderType.DELIVERY,
            status: client_1.OrderStatus.PENDING,
            deliveryAddress: '12 Quai de la Tournelle',
            items: [
                { dish: createdMenuItems['Margherita Verace'], qty: 1 },
                { dish: createdMenuItems['Rosemary Blood Orange Spritz (Mocktail)'], qty: 2 },
            ],
            daysAgo: 0,
        },
        {
            orderNumber: 'EK-20260908-0010',
            customer: customer2,
            type: client_1.OrderType.DINE_IN,
            status: client_1.OrderStatus.CANCELLED,
            tableNumber: 3,
            items: [{ dish: createdMenuItems['Duck Confit à l’Orange'], qty: 2 }],
            daysAgo: 2,
        },
    ];
    const seededOrders = {};
    for (const conf of orderConfigs) {
        let subtotal = 0;
        const orderItemsCreate = conf.items.map((it) => {
            const lineTotal = Number(it.dish.price) * it.qty;
            subtotal += lineTotal;
            return {
                menuItemId: it.dish.id,
                nameAtPurchase: it.dish.name,
                priceAtPurchase: it.dish.price,
                quantity: it.qty,
            };
        });
        const deliveryFee = conf.type === client_1.OrderType.DELIVERY ? 2.5 : 0;
        const total = subtotal + deliveryFee;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - conf.daysAgo);
        const order = await prisma.order.create({
            data: {
                orderNumber: conf.orderNumber,
                customerId: conf.customer.id,
                type: conf.type,
                status: conf.status,
                subtotal,
                deliveryFee,
                total,
                tableNumber: conf.tableNumber || null,
                deliveryAddress: conf.deliveryAddress || null,
                contactPhone: conf.customer.phone || '+1 (555) 000-0000',
                paymentMethod: 'PAY_AT_RESTAURANT',
                createdAt,
                updatedAt: createdAt,
                items: {
                    create: orderItemsCreate,
                },
            },
        });
        seededOrders[conf.orderNumber] = order;
    }
    // 6. Seed Reservations (6 Sample Reservations across statuses)
    console.log('--> Seeding Sample Reservations...');
    const reservationData = [
        {
            customer: customer1,
            dateOffsetHours: 24,
            partySize: 4,
            notes: 'Anniversary celebration. Window table preferred.',
            status: client_1.ReservationStatus.CONFIRMED,
        },
        {
            customer: customer2,
            dateOffsetHours: 48,
            partySize: 2,
            notes: 'Quiet booth for a date night.',
            status: client_1.ReservationStatus.PENDING,
        },
        {
            customer: customer3,
            dateOffsetHours: 72,
            partySize: 6,
            notes: 'Family gathering with a baby chair needed.',
            status: client_1.ReservationStatus.CONFIRMED,
        },
        {
            customer: customer4,
            dateOffsetHours: -24,
            partySize: 2,
            notes: null,
            status: client_1.ReservationStatus.COMPLETED,
        },
        {
            customer: customer1,
            dateOffsetHours: -48,
            partySize: 8,
            notes: 'Business dinner.',
            status: client_1.ReservationStatus.COMPLETED,
        },
        {
            customer: customer2,
            dateOffsetHours: -72,
            partySize: 2,
            notes: null,
            status: client_1.ReservationStatus.CANCELLED,
        },
    ];
    for (let i = 0; i < reservationData.length; i++) {
        const res = reservationData[i];
        const resDate = new Date();
        resDate.setHours(resDate.getHours() + res.dateOffsetHours);
        resDate.setMinutes(0, 0, 0);
        await prisma.reservation.create({
            data: {
                customerId: res.customer.id,
                date: resDate,
                partySize: res.partySize,
                notes: res.notes,
                status: res.status,
            },
        });
    }
    // 7. Seed Reviews (10 Sample reviews, including 1 hidden review)
    console.log('--> Seeding Sample Reviews...');
    const reviewData = [
        {
            orderNumber: 'EK-20260901-0001',
            customer: customer1,
            rating: 5,
            comment: 'Outstanding evening! The Truffle Burrata Bruschetta was divine, and the handmade tagliatelle had that authentic, silky Italian texture. Impeccable service.',
            isHidden: false,
        },
        {
            orderNumber: 'EK-20260902-0002',
            customer: customer2,
            rating: 5,
            comment: 'Ordered pizza delivery for family movie night. Arrived piping hot in under 30 minutes! The crust on the Margherita is light, airy, and deeply flavorful.',
            isHidden: false,
        },
        {
            orderNumber: 'EK-20260903-0003',
            customer: customer3,
            rating: 4,
            comment: 'The Wagyu burger is hands down one of the best in the city. Perfectly medium-rare with a generous slather of truffle aioli. Will order again soon.',
            isHidden: false,
        },
        {
            orderNumber: 'EK-20260904-0004',
            customer: customer1,
            rating: 5,
            comment: 'The sea bass with caperberry butter melted in my mouth. Wonderful atmosphere and attentive staff who genuinely care about European hospitality.',
            isHidden: false,
        },
        {
            orderNumber: 'EK-20260905-0005',
            customer: customer4,
            rating: 5,
            comment: 'The Prosciutto and Fig pizza was an absolute revelation. Sweet, salty, savory harmony. Also loved the Madagascar vanilla crème brûlée with the crisp caramel top!',
            isHidden: false,
        },
        {
            orderNumber: undefined,
            customer: customer3,
            rating: 5,
            comment: 'Euroshub Kitchen is our new regular Friday bistro. Great wine selection and relaxing acoustic ambiance.',
            isHidden: false,
        },
        {
            orderNumber: undefined,
            customer: customer2,
            rating: 4,
            comment: 'Warm rustic vibe, wonderful espresso, and delicious desserts. Perfect spot for catching up with friends.',
            isHidden: false,
        },
        {
            orderNumber: undefined,
            customer: customer4,
            rating: 1,
            comment: 'Spam test comment with inappropriate language to test the admin moderation feature.',
            isHidden: true,
        },
    ];
    for (const rev of reviewData) {
        const order = rev.orderNumber ? seededOrders[rev.orderNumber] : null;
        await prisma.review.create({
            data: {
                customerId: rev.customer.id,
                orderId: order ? order.id : null,
                rating: rev.rating,
                comment: rev.comment,
                isHidden: rev.isHidden,
            },
        });
    }
    console.log('==> Seeding completed successfully and idempotently!');
    console.log('--------------------------------------------------');
    console.log('Admin Account:    admin@euroshubkitchen.com / AdminPassword123!');
    console.log('Customer Account: marco.rossi@example.com / Customer123!');
    console.log('--------------------------------------------------');
}
main()
    .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
