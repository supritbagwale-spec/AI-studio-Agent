/**
 * In-Memory SQL Execution Engine powered by AlaSQL with Retail Schema
 */
import alasql from 'alasql';
import { generateRetailDatabase, Store, Product, Customer, SalesTransaction, ReturnRecord } from '../data/retailDatabase.ts';

export interface SqlQueryResult {
  success: boolean;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface GuardrailCheckResult {
  isSafe: boolean;
  reason?: string;
  detectedKeywords?: string[];
  refusalMessage?: string;
}

export class RetailSqlEngine {
  private static instance: RetailSqlEngine;
  private isInitialized = false;
  public dataset: {
    stores: Store[];
    products: Product[];
    customers: Customer[];
    sales_transactions: SalesTransaction[];
    returns: ReturnRecord[];
  };

  private constructor() {
    this.dataset = generateRetailDatabase();
    this.initDatabase();
  }

  public static getInstance(): RetailSqlEngine {
    if (!RetailSqlEngine.instance) {
      RetailSqlEngine.instance = new RetailSqlEngine();
    }
    return RetailSqlEngine.instance;
  }

  private initDatabase(): void {
    if (this.isInitialized) return;

    try {
      // Create tables in alasql
      alasql('DROP TABLE IF EXISTS stores');
      alasql('DROP TABLE IF EXISTS products');
      alasql('DROP TABLE IF EXISTS customers');
      alasql('DROP TABLE IF EXISTS sales_transactions');
      alasql('DROP TABLE IF EXISTS `returns`');

      alasql(`
        CREATE TABLE stores (
          store_id STRING,
          store_name STRING,
          region STRING,
          city STRING,
          store_type STRING
        )
      `);

      alasql(`
        CREATE TABLE products (
          product_id STRING,
          product_name STRING,
          category STRING,
          sub_category STRING,
          base_price FLOAT
        )
      `);

      alasql(`
        CREATE TABLE customers (
          customer_id STRING,
          customer_segment STRING,
          signup_date STRING,
          preferred_channel STRING,
          city STRING
        )
      `);

      alasql(`
        CREATE TABLE sales_transactions (
          order_id STRING,
          order_date STRING,
          store_id STRING,
          product_id STRING,
          customer_id STRING,
          sales_channel STRING,
          units_sold INT,
          unit_price FLOAT,
          discount_pct FLOAT,
          payment_status STRING,
          delivery_status STRING
        )
      `);

      alasql(`
        CREATE TABLE \`returns\` (
          return_id STRING,
          order_id STRING,
          return_date STRING,
          return_reason STRING
        )
      `);

      // Populate tables directly
      alasql.tables.stores.data = JSON.parse(JSON.stringify(this.dataset.stores));
      alasql.tables.products.data = JSON.parse(JSON.stringify(this.dataset.products));
      alasql.tables.customers.data = JSON.parse(JSON.stringify(this.dataset.customers));
      alasql.tables.sales_transactions.data = JSON.parse(JSON.stringify(this.dataset.sales_transactions));
      alasql.tables['returns'].data = JSON.parse(JSON.stringify(this.dataset.returns));

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize AlaSQL tables:', err);
    }
  }

  /**
   * Safety & Guardrail Validation Node
   * Policy: Strict read-only SELECT queries are permitted.
   * If destructive, operational, modification keywords or multi-statements detected -> REFUSE.
   */
  public validateGuardrails(sqlOrPrompt: string): GuardrailCheckResult {
    const raw = sqlOrPrompt.trim();
    if (!raw) {
      return {
        isSafe: false,
        reason: 'Empty query',
        refusalMessage: '🚫 Access Refused by Safety Guardrail\nReason: Unsafe SQL operational keyword detected.\nPolicy: Only read-only data analysis (SELECT) queries are permitted.',
      };
    }

    // List of banned operational, destructive, DDL, DML modification keywords
    const forbiddenKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
      'CREATE', 'REPLACE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
      'CALL', 'INTO OUTFILE', 'DUMPFILE', 'LOAD DATA', 'SHUTDOWN',
      'FLUSH', 'RENAME', 'ATTACH', 'DETACH', 'UPSERT'
    ];

    // Regex checking whole word matches (case-insensitive)
    const detected: string[] = [];
    for (const kw of forbiddenKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(raw)) {
        detected.push(kw);
      }
    }

    // Check for multiple statements (e.g. semicolon separating statements, not inside quotes)
    // Semicolon followed by non-whitespace and not at very end of string
    const sanitized = raw.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
    const statementCount = sanitized.split(';').map(s => s.trim()).filter(Boolean).length;

    if (detected.length > 0 || statementCount > 1) {
      return {
        isSafe: false,
        reason: detected.length > 0 
          ? `Unsafe operational keywords: ${detected.join(', ')}`
          : 'Multiple SQL statements or chained execution detected',
        detectedKeywords: detected,
        refusalMessage: '🚫 Access Refused by Safety Guardrail\nReason: Unsafe SQL operational keyword detected.\nPolicy: Only read-only data analysis (SELECT) queries are permitted.',
      };
    }

    // Ensure it looks like a read-only query (starts with SELECT or WITH)
    const upperFirstToken = raw.trim().replace(/^[\(\s]+/, '').split(/\s+/)[0]?.toUpperCase();
    if (upperFirstToken !== 'SELECT' && upperFirstToken !== 'WITH') {
      return {
        isSafe: false,
        reason: `Only read-only SELECT or WITH statements are allowed. Found: ${upperFirstToken}`,
        refusalMessage: '🚫 Access Refused by Safety Guardrail\nReason: Unsafe SQL operational keyword detected.\nPolicy: Only read-only data analysis (SELECT) queries are permitted.',
      };
    }

    return { isSafe: true };
  }

  /**
   * Executes a safe SQL query and returns results
   */
  public executeQuery(sql: string): SqlQueryResult {
    const startTime = performance.now();
    let cleanSql = sql.trim().replace(/;+$/, ''); // strip trailing semicolon

    // AlaSQL treats `returns` as a reserved keyword, so escape it as `returns` if not already escaped
    cleanSql = cleanSql.replace(/\b(JOIN|FROM)\s+returns\b/gi, '$1 `returns`');

    try {
      const rawResult = alasql(cleanSql);
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

      // rawResult can be an array of objects
      if (Array.isArray(rawResult)) {
        const rows = rawResult;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return {
          success: true,
          columns,
          rows,
          rowCount: rows.length,
          executionTimeMs,
        };
      } else {
        return {
          success: true,
          columns: ['result'],
          rows: [{ result: rawResult }],
          rowCount: 1,
          executionTimeMs,
        };
      }
    } catch (err: any) {
      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
      return {
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: err?.message || 'SQL execution failed',
      };
    }
  }

  /**
   * Returns schema details for UI inspector
   */
  public getSchemaMetadata() {
    return [
      {
        tableName: 'stores',
        description: 'Physical & regional store locations',
        rowCount: this.dataset.stores.length,
        columns: [
          { name: 'store_id', type: 'VARCHAR(20)', key: 'PRIMARY KEY', desc: 'Unique store identifier' },
          { name: 'store_name', type: 'VARCHAR(100)', key: '', desc: 'Store display name' },
          { name: 'region', type: 'VARCHAR(20)', key: '', desc: 'Geographic region (East, West, South, Central)' },
          { name: 'city', type: 'VARCHAR(50)', key: '', desc: 'Metropolitan area' },
          { name: 'store_type', type: 'VARCHAR(30)', key: '', desc: 'Format (Flagship, Mall, Outlet, Express)' },
        ],
        sample: this.dataset.stores.slice(0, 3),
      },
      {
        tableName: 'products',
        description: 'Catalog of merchandise, categories, and MSRP',
        rowCount: this.dataset.products.length,
        columns: [
          { name: 'product_id', type: 'VARCHAR(20)', key: 'PRIMARY KEY', desc: 'SKU identifier' },
          { name: 'product_name', type: 'VARCHAR(150)', key: '', desc: 'Product title' },
          { name: 'category', type: 'VARCHAR(50)', key: '', desc: 'Merchandise category (Electronics, Apparel, etc.)' },
          { name: 'sub_category', type: 'VARCHAR(50)', key: '', desc: 'Granular sub-department' },
          { name: 'base_price', type: 'DECIMAL(10,2)', key: '', desc: 'Standard retail list price' },
        ],
        sample: this.dataset.products.slice(0, 3),
      },
      {
        tableName: 'customers',
        description: 'Customer profiles, membership segments, and preferences',
        rowCount: this.dataset.customers.length,
        columns: [
          { name: 'customer_id', type: 'VARCHAR(20)', key: 'PRIMARY KEY', desc: 'Customer account ID' },
          { name: 'customer_segment', type: 'VARCHAR(50)', key: '', desc: 'Cohort (VIP / Enterprise, High Value, Regular, Bargain)' },
          { name: 'signup_date', type: 'DATE', key: '', desc: 'Account registration date' },
          { name: 'preferred_channel', type: 'VARCHAR(30)', key: '', desc: 'Preferred shopping channel' },
          { name: 'city', type: 'VARCHAR(50)', key: '', desc: 'Primary billing city' },
        ],
        sample: this.dataset.customers.slice(0, 3),
      },
      {
        tableName: 'sales_transactions',
        description: 'Transactional line-item purchase orders',
        rowCount: this.dataset.sales_transactions.length,
        columns: [
          { name: 'order_id', type: 'VARCHAR(20)', key: '', desc: 'Order transaction reference' },
          { name: 'order_date', type: 'DATE', key: '', desc: 'Purchase date (YYYY-MM-DD)' },
          { name: 'store_id', type: 'VARCHAR(20)', key: 'FK -> stores', desc: 'Store where sale originated' },
          { name: 'product_id', type: 'VARCHAR(20)', key: 'FK -> products', desc: 'Product item purchased' },
          { name: 'customer_id', type: 'VARCHAR(20)', key: 'FK -> customers', desc: 'Customer making purchase' },
          { name: 'sales_channel', type: 'VARCHAR(30)', key: '', desc: 'Online, In-Store, Mobile App, Wholesale' },
          { name: 'units_sold', type: 'INT', key: '', desc: 'Quantity of units purchased' },
          { name: 'unit_price', type: 'DECIMAL(10,2)', key: '', desc: 'Actual realized selling price per unit' },
          { name: 'discount_pct', type: 'DECIMAL(5,2)', key: '', desc: 'Discount percentage applied (0-100)' },
          { name: 'payment_status', type: 'VARCHAR(30)', key: '', desc: 'Completed, Pending, Refunded' },
          { name: 'delivery_status', type: 'VARCHAR(30)', key: '', desc: 'Delivered, In-Transit, Cancelled' },
        ],
        sample: this.dataset.sales_transactions.slice(0, 3),
      },
      {
        tableName: 'returns',
        description: 'Product returns, return dates, and customer reasons',
        rowCount: this.dataset.returns.length,
        columns: [
          { name: 'return_id', type: 'VARCHAR(20)', key: 'PRIMARY KEY', desc: 'RMA return ticket ID' },
          { name: 'order_id', type: 'VARCHAR(20)', key: 'FK -> sales_transactions', desc: 'Associated sales order' },
          { name: 'return_date', type: 'DATE', key: '', desc: 'Date return was processed' },
          { name: 'return_reason', type: 'VARCHAR(100)', key: '', desc: 'Customer return cause' },
        ],
        sample: this.dataset.returns.slice(0, 3),
      },
    ];
  }
}
