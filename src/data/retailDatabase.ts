/**
 * Retail Dataset Definitions & Seed Generator
 * Tables:
 * 1. stores(store_id, store_name, region, city, store_type)
 * 2. products(product_id, product_name, category, sub_category, base_price)
 * 3. customers(customer_id, customer_segment, signup_date, preferred_channel, city)
 * 4. sales_transactions(order_id, order_date, store_id, product_id, customer_id, sales_channel, units_sold, unit_price, discount_pct, payment_status, delivery_status)
 * 5. returns(return_id, order_id, return_date, return_reason)
 */

export interface Store {
  store_id: string;
  store_name: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  city: string;
  store_type: 'Flagship' | 'Mall' | 'Outlet' | 'Express';
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  sub_category: string;
  base_price: number;
}

export interface Customer {
  customer_id: string;
  customer_segment: 'VIP / Enterprise' | 'High Value' | 'Regular Shopper' | 'Occasional / Bargain';
  signup_date: string;
  preferred_channel: 'Online' | 'In-Store' | 'Mobile App';
  city: string;
}

export interface SalesTransaction {
  order_id: string;
  order_date: string;
  store_id: string;
  product_id: string;
  customer_id: string;
  sales_channel: 'Online' | 'In-Store' | 'Mobile App' | 'Wholesale';
  units_sold: number;
  unit_price: number;
  discount_pct: number;
  payment_status: 'Completed' | 'Pending' | 'Refunded';
  delivery_status: 'Delivered' | 'In-Transit' | 'Cancelled';
}

export interface ReturnRecord {
  return_id: string;
  order_id: string;
  return_date: string;
  return_reason: 'Defective Item' | 'Wrong Size / Fit' | 'Not as Pictured' | 'Customer Remorse' | 'Late Delivery' | 'Damaged in Transit';
}

export const STORES_DATA: Store[] = [
  { store_id: 'STR-101', store_name: 'Metro Flagship Downtown', region: 'East', city: 'New York', store_type: 'Flagship' },
  { store_id: 'STR-102', store_name: 'Silicon Valley Innovation Hub', region: 'West', city: 'San Jose', store_type: 'Flagship' },
  { store_id: 'STR-103', store_name: 'Magnificent Mile Galleria', region: 'Central', city: 'Chicago', store_type: 'Mall' },
  { store_id: 'STR-104', store_name: 'Biscayne Bay Boutique', region: 'South', city: 'Miami', store_type: 'Mall' },
  { store_id: 'STR-105', store_name: 'Pacific Northwest Express', region: 'West', city: 'Seattle', store_type: 'Express' },
  { store_id: 'STR-106', store_name: 'Lonestar Prime Outlet', region: 'South', city: 'Dallas', store_type: 'Outlet' },
  { store_id: 'STR-107', store_name: 'Golden Gate Tech Depot', region: 'West', city: 'San Francisco', store_type: 'Mall' },
  { store_id: 'STR-108', store_name: 'New England Heritage Center', region: 'East', city: 'Boston', store_type: 'Mall' },
  { store_id: 'STR-109', store_name: 'Peach Tree Premium Pavilion', region: 'South', city: 'Atlanta', store_type: 'Flagship' },
  { store_id: 'STR-110', store_name: 'Twin Cities Transit Express', region: 'Central', city: 'Minneapolis', store_type: 'Express' },
  { store_id: 'STR-111', store_name: 'Rockies High-Altitude Outlet', region: 'West', city: 'Denver', store_type: 'Outlet' },
  { store_id: 'STR-112', store_name: 'Liberty Bell Retail Express', region: 'East', city: 'Philadelphia', store_type: 'Express' },
];

export const PRODUCTS_DATA: Product[] = [
  { product_id: 'PRD-001', product_name: 'AeroNoise Pro 7 Noise-Canceling Headphones', category: 'Electronics', sub_category: 'Audio', base_price: 349.99 },
  { product_id: 'PRD-002', product_name: 'UltraVision 4K OLED Gaming Monitor 32"', category: 'Electronics', sub_category: 'Displays', base_price: 899.99 },
  { product_id: 'PRD-003', product_name: 'QuantumBook Titanium 16" Workstation', category: 'Electronics', sub_category: 'Computers', base_price: 1999.00 },
  { product_id: 'PRD-004', product_name: 'PulseTrack GPS Smartwatch Gen 4', category: 'Electronics', sub_category: 'Wearables', base_price: 279.50 },
  { product_id: 'PRD-005', product_name: 'BassCore True Wireless Earbuds', category: 'Electronics', sub_category: 'Audio', base_price: 129.99 },
  { product_id: 'PRD-006', product_name: 'Italian Merino Wool Slim Blazer', category: 'Apparel', sub_category: 'Formalwear', base_price: 420.00 },
  { product_id: 'PRD-007', product_name: 'All-Weather Tech-Trek Parka', category: 'Apparel', sub_category: 'Outerwear', base_price: 310.00 },
  { product_id: 'PRD-008', product_name: 'Performance Dry-Fit Training Joggers', category: 'Apparel', sub_category: 'Activewear', base_price: 85.00 },
  { product_id: 'PRD-009', product_name: 'Organic Combed Cotton Oxford Shirt', category: 'Apparel', sub_category: 'Shirts', base_price: 75.00 },
  { product_id: 'PRD-010', product_name: 'Cashmere Ribbed Turtleneck Sweater', category: 'Apparel', sub_category: 'Knitwear', base_price: 195.00 },
  { product_id: 'PRD-011', product_name: 'Barista Touch Espresso Machine & Grinder', category: 'Home & Kitchen', sub_category: 'Small Appliances', base_price: 799.00 },
  { product_id: 'PRD-012', product_name: 'ChefMaster 7-Ply Stainless Cookware 10-Piece', category: 'Home & Kitchen', sub_category: 'Cookware', base_price: 549.95 },
  { product_id: 'PRD-013', product_name: 'SmartAir Pure HEPA Ionizing Purifier', category: 'Home & Kitchen', sub_category: 'Air Quality', base_price: 289.00 },
  { product_id: 'PRD-014', product_name: 'ErgoRest Memory Foam Contour Pillow', category: 'Home & Kitchen', sub_category: 'Bedding', base_price: 69.99 },
  { product_id: 'PRD-015', product_name: 'Cast Iron French Dutch Oven 6-Qt', category: 'Home & Kitchen', sub_category: 'Cookware', base_price: 180.00 },
  { product_id: 'PRD-016', product_name: 'TrailBlazer Carbon Fiber Trekking Poles', category: 'Sports & Outdoors', sub_category: 'Hiking', base_price: 135.00 },
  { product_id: 'PRD-017', product_name: 'HydroShield 4-Person Ultralight Tent', category: 'Sports & Outdoors', sub_category: 'Camping', base_price: 360.00 },
  { product_id: 'PRD-018', product_name: 'AeroSpeed Carbon Road Bicycle Helmet', category: 'Sports & Outdoors', sub_category: 'Cycling', base_price: 175.00 },
  { product_id: 'PRD-019', product_name: 'Zenith Pro Dual-Density Yoga Mat', category: 'Sports & Outdoors', sub_category: 'Fitness', base_price: 65.00 },
  { product_id: 'PRD-020', product_name: 'Kevlar Reinforced Gravel Road Bike Tire', category: 'Sports & Outdoors', sub_category: 'Cycling', base_price: 72.00 },
  { product_id: 'PRD-021', product_name: 'DermaGlow Ultrasonic Skin Rejuvenator', category: 'Health & Beauty', sub_category: 'Skincare Devices', base_price: 219.00 },
  { product_id: 'PRD-022', product_name: 'HydraSilk Botanical Facial Serum 50ml', category: 'Health & Beauty', sub_category: 'Cosmetics', base_price: 88.00 },
  { product_id: 'PRD-023', product_name: 'SonicClean Diamond Dental Station', category: 'Health & Beauty', sub_category: 'Personal Care', base_price: 149.00 },
  { product_id: 'PRD-024', product_name: 'DeepTissue Percussive Massage Gun', category: 'Health & Beauty', sub_category: 'Wellness', base_price: 240.00 },
  { product_id: 'PRD-025', product_name: 'Mineral Sun Defense Broad Spectrum SPF 50', category: 'Health & Beauty', sub_category: 'Cosmetics', base_price: 42.00 },
];

export const CUSTOMERS_DATA: Customer[] = [
  { customer_id: 'CUST-001', customer_segment: 'VIP / Enterprise', signup_date: '2023-01-15', preferred_channel: 'Online', city: 'New York' },
  { customer_id: 'CUST-002', customer_segment: 'High Value', signup_date: '2023-02-20', preferred_channel: 'In-Store', city: 'San Jose' },
  { customer_id: 'CUST-003', customer_segment: 'Regular Shopper', signup_date: '2023-03-12', preferred_channel: 'Online', city: 'Chicago' },
  { customer_id: 'CUST-004', customer_segment: 'VIP / Enterprise', signup_date: '2023-04-05', preferred_channel: 'Mobile App', city: 'Miami' },
  { customer_id: 'CUST-005', customer_segment: 'Occasional / Bargain', signup_date: '2023-05-18', preferred_channel: 'Online', city: 'Seattle' },
  { customer_id: 'CUST-006', customer_segment: 'High Value', signup_date: '2023-06-22', preferred_channel: 'In-Store', city: 'Dallas' },
  { customer_id: 'CUST-007', customer_segment: 'Regular Shopper', signup_date: '2023-07-30', preferred_channel: 'Mobile App', city: 'San Francisco' },
  { customer_id: 'CUST-008', customer_segment: 'VIP / Enterprise', signup_date: '2023-08-14', preferred_channel: 'Online', city: 'Boston' },
  { customer_id: 'CUST-009', customer_segment: 'Regular Shopper', signup_date: '2023-09-09', preferred_channel: 'In-Store', city: 'Atlanta' },
  { customer_id: 'CUST-010', customer_segment: 'Occasional / Bargain', signup_date: '2023-10-21', preferred_channel: 'Online', city: 'Denver' },
  { customer_id: 'CUST-011', customer_segment: 'High Value', signup_date: '2023-11-04', preferred_channel: 'Online', city: 'New York' },
  { customer_id: 'CUST-012', customer_segment: 'Regular Shopper', signup_date: '2023-12-19', preferred_channel: 'Mobile App', city: 'Chicago' },
  { customer_id: 'CUST-013', customer_segment: 'VIP / Enterprise', signup_date: '2024-01-08', preferred_channel: 'In-Store', city: 'San Jose' },
  { customer_id: 'CUST-014', customer_segment: 'Occasional / Bargain', signup_date: '2024-02-14', preferred_channel: 'Online', city: 'Seattle' },
  { customer_id: 'CUST-015', customer_segment: 'High Value', signup_date: '2024-03-01', preferred_channel: 'Mobile App', city: 'Dallas' },
  { customer_id: 'CUST-016', customer_segment: 'Regular Shopper', signup_date: '2024-03-25', preferred_channel: 'In-Store', city: 'Miami' },
  { customer_id: 'CUST-017', customer_segment: 'VIP / Enterprise', signup_date: '2024-04-10', preferred_channel: 'Online', city: 'San Francisco' },
  { customer_id: 'CUST-018', customer_segment: 'Occasional / Bargain', signup_date: '2024-05-17', preferred_channel: 'Online', city: 'Atlanta' },
  { customer_id: 'CUST-019', customer_segment: 'High Value', signup_date: '2024-06-03', preferred_channel: 'In-Store', city: 'Boston' },
  { customer_id: 'CUST-020', customer_segment: 'Regular Shopper', signup_date: '2024-06-28', preferred_channel: 'Mobile App', city: 'Denver' },
  { customer_id: 'CUST-021', customer_segment: 'VIP / Enterprise', signup_date: '2024-07-15', preferred_channel: 'Online', city: 'New York' },
  { customer_id: 'CUST-022', customer_segment: 'Regular Shopper', signup_date: '2024-08-02', preferred_channel: 'In-Store', city: 'Minneapolis' },
  { customer_id: 'CUST-023', customer_segment: 'High Value', signup_date: '2024-08-20', preferred_channel: 'Mobile App', city: 'Philadelphia' },
  { customer_id: 'CUST-024', customer_segment: 'Occasional / Bargain', signup_date: '2024-09-11', preferred_channel: 'Online', city: 'Dallas' },
  { customer_id: 'CUST-025', customer_segment: 'Regular Shopper', signup_date: '2024-10-05', preferred_channel: 'In-Store', city: 'San Jose' },
  { customer_id: 'CUST-026', customer_segment: 'VIP / Enterprise', signup_date: '2024-10-29', preferred_channel: 'Online', city: 'Seattle' },
  { customer_id: 'CUST-027', customer_segment: 'High Value', signup_date: '2024-11-18', preferred_channel: 'Mobile App', city: 'Chicago' },
  { customer_id: 'CUST-028', customer_segment: 'Regular Shopper', signup_date: '2024-12-04', preferred_channel: 'In-Store', city: 'Miami' },
  { customer_id: 'CUST-029', customer_segment: 'Occasional / Bargain', signup_date: '2025-01-12', preferred_channel: 'Online', city: 'San Francisco' },
  { customer_id: 'CUST-030', customer_segment: 'VIP / Enterprise', signup_date: '2025-02-14', preferred_channel: 'Online', city: 'New York' },
];

/**
 * Deterministically generates ~300 sales transactions and returns for the schema
 */
export function generateRetailDatabase() {
  const transactions: SalesTransaction[] = [];
  const returnsList: ReturnRecord[] = [];

  // Deterministic PRNG
  let seed = 42;
  function rand() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const channels: ('Online' | 'In-Store' | 'Mobile App' | 'Wholesale')[] = ['Online', 'In-Store', 'Mobile App', 'Wholesale'];
  const channelWeights = [0.45, 0.35, 0.15, 0.05];

  function pickWeighted<T>(items: T[], weights: number[]): T {
    const r = rand();
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += weights[i];
      if (r <= sum) return items[i];
    }
    return items[items.length - 1];
  }

  const returnReasons: ReturnRecord['return_reason'][] = [
    'Defective Item',
    'Wrong Size / Fit',
    'Not as Pictured',
    'Customer Remorse',
    'Late Delivery',
    'Damaged in Transit',
  ];

  // Dates between 2024-01-01 and 2026-06-30
  const startDate = new Date('2024-01-01').getTime();
  const endDate = new Date('2026-06-30').getTime();

  for (let i = 1; i <= 320; i++) {
    const orderNum = String(i).padStart(4, '0');
    const order_id = `ORD-${orderNum}`;

    const randomTimestamp = startDate + rand() * (endDate - startDate);
    const orderDateObj = new Date(randomTimestamp);
    const order_date = orderDateObj.toISOString().split('T')[0];

    const store = STORES_DATA[Math.floor(rand() * STORES_DATA.length)];
    const product = PRODUCTS_DATA[Math.floor(rand() * PRODUCTS_DATA.length)];
    const customer = CUSTOMERS_DATA[Math.floor(rand() * CUSTOMERS_DATA.length)];

    const sales_channel = pickWeighted(channels, channelWeights);
    const units_sold = Math.floor(rand() * 4) + 1; // 1 to 4 units

    // Discount percentage: either 0%, 5%, 10%, 15%, 20%, 25%
    const discounts = [0, 0, 5, 10, 15, 20, 25];
    const discount_pct = discounts[Math.floor(rand() * discounts.length)];

    // Slight variance on unit_price around base_price
    const priceVariance = (rand() * 0.1) - 0.05; // +/- 5%
    const unit_price = Number((product.base_price * (1 + priceVariance)).toFixed(2));

    const isCancelled = rand() < 0.03;
    const payment_status = isCancelled ? 'Refunded' : 'Completed';
    const delivery_status = isCancelled ? 'Cancelled' : (rand() < 0.08 ? 'In-Transit' : 'Delivered');

    transactions.push({
      order_id,
      order_date,
      store_id: store.store_id,
      product_id: product.product_id,
      customer_id: customer.customer_id,
      sales_channel,
      units_sold,
      unit_price,
      discount_pct,
      payment_status,
      delivery_status,
    });

    // Probability of return based on category and channel
    // Online has higher return rate (~14%), Apparel has higher return rate
    let returnProb = 0.08;
    if (sales_channel === 'Online') returnProb += 0.06;
    if (product.category === 'Apparel') returnProb += 0.08;
    if (product.category === 'Electronics') returnProb += 0.03;

    if (rand() < returnProb && !isCancelled) {
      const returnDaysAfter = Math.floor(rand() * 14) + 2;
      const returnDateObj = new Date(randomTimestamp + returnDaysAfter * 86400000);
      const return_date = returnDateObj.toISOString().split('T')[0];
      const return_reason = returnReasons[Math.floor(rand() * returnReasons.length)];
      const return_id = `RET-${String(returnsList.length + 1).padStart(4, '0')}`;

      returnsList.push({
        return_id,
        order_id,
        return_date,
        return_reason,
      });
    }
  }

  return {
    stores: STORES_DATA,
    products: PRODUCTS_DATA,
    customers: CUSTOMERS_DATA,
    sales_transactions: transactions,
    returns: returnsList,
  };
}
