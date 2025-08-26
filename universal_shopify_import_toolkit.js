/**
 * SHOPIFY PRODUCTS IMPORT TOOLKIT - UNIVERSAL GOOGLE APPS SCRIPT
 * 
 * Copy this entire script into Google Apps Script and customize the VENDOR_CONFIG
 * to match your vendor's CSV structure. Works with ANY vendor data format!
 * 
 * Based on analysis of 5 real vendor scripts:
 * - Ancient Wisdom, Distinction Crystals, Ghostwithin, Psychic Tree, Silver Jewellery
 * 
 * @version 1.0.1 - CORRECTED: Standard Shopify CSV format (39 columns)
 * @license MIT
 */

// =====================================================
// 🔧 CONFIGURATION - CUSTOMIZE THIS FOR YOUR VENDOR!
// =====================================================

const VENDOR_CONFIG = {
  // ===== BASIC SETUP - Change these for your vendor =====
  vendor: "Your Vendor Name",              // e.g., "Crystal Wellness Co"
  sourceSheet: "VendorOrder",              // Your source sheet name
  targetSheet: "shopify_products",         // Target Shopify sheet
  
  // ===== COLUMN MAPPINGS - Map YOUR CSV columns =====
  columnMappings: {
    title: 0,        // Column A = Title
    quantity: 1,     // Column B = Quantity
    cost: 2,         // Column C = Cost (optional, set to -1 if no cost column)
    price: 3,        // Column D = Price 
    sku: 4,          // Column E = SKU
    weight: 5,       // Column F = Weight (optional, set to -1 if no weight)
    description: 6   // Column G = Description (optional, set to -1 if no description)
  },
  
  // ===== CONTENT STRATEGY =====
  contentStrategy: {
    description: "source",    // "empty", "static", or "source"
    staticContent: "",       // If using "static", put your HTML description here
    htmlWrap: false          // Set to true to wrap descriptions in <p> tags
  },
  
  // ===== BUSINESS RULES - Add your product categorization =====
  categoryRules: [
    {
      keywords: ["pendant", "necklace"],
      category: "Apparel & Accessories > Jewelry",
      priority: 10
    },
    {
      keywords: ["bracelet", "earrings"],
      category: "Apparel & Accessories > Jewelry",
      priority: 9
    },
    {
      keywords: ["crystal", "quartz", "amethyst", "healing"],
      category: "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts",
      priority: 8
    }
  ],
  
  typeRules: [
    { keywords: ["pendant"], type: "Pendant" },
    { keywords: ["bracelet"], type: "Bracelet" },
    { keywords: ["earrings"], type: "Earrings" },
    { keywords: ["necklace"], type: "Necklace" },
    { keywords: ["ring"], type: "Ring" },
    { keywords: ["crystal"], type: "Crystal" },
    { keywords: ["wand"], type: "Crystal Wand" },
    { keywords: ["point"], type: "Crystal Point" }
  ],
  
  tagRules: [
    // Crystal types - add your specific crystals
    { keywords: ["amethyst"], tags: ["Amethyst", "Purple Crystal"] },
    { keywords: ["rose quartz"], tags: ["Rose Quartz", "Love Stone"] },
    { keywords: ["clear quartz"], tags: ["Clear Quartz", "Master Healer"] },
    { keywords: ["tiger eye"], tags: ["Tiger Eye", "Protection"] },
    { keywords: ["selenite"], tags: ["Selenite", "Cleansing"] },
    
    // Product features
    { keywords: ["wire wrapped"], tags: ["Wire Wrapped"] },
    { keywords: ["natural"], tags: ["Natural", "Authentic"] },
    { keywords: ["handmade"], tags: ["Handmade", "Artisan"] },
    
    // Add your own keyword → tag mappings here!
  ],
  
  // ===== ADVANCED FEATURES =====
  duplicateHandling: {
    enabled: true,           // Set to false to disable duplicate checking
    field: "variantSku",     // Field to check for duplicates
    action: "skip"           // "skip" or "replace"
  },
  
  // ===== DEFAULTS =====
  defaults: {
    category: "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts",
    type: "Product",
    tags: ["Spiritual", "Natural", "Handmade"], // Base tags for all products
    published: true,
    requiresShipping: true,
    taxable: true,
    inventoryPolicy: "deny",
    fulfillmentService: "manual",
    weightUnit: "g"          // "g", "kg", "lb", or "oz"
  }
};

// =====================================================
// 📊 SHOPIFY COLUMNS (39 STANDARD) - DON'T CHANGE
// =====================================================

const SHOPIFY_COLUMNS = {
  handle: 0, title: 1, body: 2, vendor: 3, productCategory: 4, type: 5, tags: 6, 
  published: 7, option1Name: 8, option1Value: 9, option1LinkedTo: 10, option2Name: 11, 
  option2Value: 12, option2LinkedTo: 13, option3Name: 14, option3Value: 15, 
  option3LinkedTo: 16, variantSku: 17, variantGrams: 18, variantInvTracker: 19, 
  variantInvQty: 20, variantInvPolicy: 21, variantFulfillment: 22, variantPrice: 23, 
  variantCompareAtPrice: 24, variantRequiresShipping: 25, variantTaxable: 26, 
  variantBarcode: 27, imageSrc: 28, imagePosition: 29, imageAltText: 30, giftCard: 31, 
  seoTitle: 32, seoDescription: 33, variantImage: 34, variantWeightUnit: 35, 
  variantTaxCode: 36, costPerItem: 37, status: 38
};

// =====================================================
// 🚀 MAIN IMPORT FUNCTION - RUN THIS!
// =====================================================

function importVendorProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    console.log("🚀 Starting Universal Shopify Import Toolkit...");
    
    // Get source data
    const sourceSheet = ss.getSheetByName(VENDOR_CONFIG.sourceSheet);
    if (!sourceSheet) {
      throw new Error(`❌ Source sheet '${VENDOR_CONFIG.sourceSheet}' not found!`);
    }
    
    const sourceData = sourceSheet.getDataRange().getValues();
    console.log(`📥 Found ${sourceData.length - 1} rows in source sheet`);
    
    // Get target sheet
    let targetSheet = ss.getSheetByName(VENDOR_CONFIG.targetSheet);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(VENDOR_CONFIG.targetSheet);
      initializeShopifySheet(targetSheet);
    }
    
    // Build duplicate prevention set if enabled
    const existingSKUs = new Set();
    if (VENDOR_CONFIG.duplicateHandling.enabled) {
      const targetData = targetSheet.getDataRange().getValues();
      for (let i = 1; i < targetData.length; i++) {
        const sku = targetData[i][SHOPIFY_COLUMNS.variantSku];
        if (sku) existingSKUs.add(sku.toString().trim());
      }
      console.log(`🔍 Found ${existingSKUs.size} existing SKUs for duplicate checking`);
    }
    
    // Process products
    const products = extractProducts(sourceData, existingSKUs);
    console.log(`✅ Extracted ${Object.keys(products).length} new products`);
    
    // Transform to Shopify format
    const shopifyRows = transformToShopify(products);
    console.log(`🔄 Transformed ${shopifyRows.length} products to Shopify format`);
    
    // Write to target sheet
    if (shopifyRows.length > 0) {
      const startRow = targetSheet.getLastRow() + 1;
      targetSheet.getRange(startRow, 1, shopifyRows.length, shopifyRows[0].length)
        .setValues(shopifyRows);
      
      console.log(`✅ Successfully imported ${shopifyRows.length} products!`);
      
      // Show success dialog
      SpreadsheetApp.getUi().alert(
        'Import Complete!', 
        `✅ Successfully imported ${shopifyRows.length} products from ${VENDOR_CONFIG.vendor}\n\nCheck the '${VENDOR_CONFIG.targetSheet}' sheet for results.`,
        SpreadsheetApp.getUi().Button.OK
      );
    } else {
      console.log("ℹ️ No new products to import");
      SpreadsheetApp.getUi().alert('No New Products', 'All products already exist in the target sheet.', SpreadsheetApp.getUi().Button.OK);
    }
    
    return shopifyRows.length;
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    SpreadsheetApp.getUi().alert('Import Failed', `❌ Error: ${error.message}`, SpreadsheetApp.getUi().Button.OK);
    throw error;
  }
}

// =====================================================
// 📋 CORE PROCESSING FUNCTIONS
// =====================================================

function extractProducts(sourceData, existingSKUs) {
  const products = {};
  const cols = VENDOR_CONFIG.columnMappings;
  
  // Start from row 1 to skip header
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    
    // Extract core fields
    const title = getColumnValue(row, cols.title);
    const sku = getColumnValue(row, cols.sku);
    
    // Skip empty/invalid rows
    if (!title || !sku || title === 'Title' || sku === 'SKU') {
      continue;
    }
    
    // Check for duplicates if enabled
    if (VENDOR_CONFIG.duplicateHandling.enabled && existingSKUs.has(sku.toString().trim())) {
      console.log(`⏭️ Skipping duplicate product: ${sku}`);
      continue;
    }
    
    // Extract other fields
    const quantity = parseInt(getColumnValue(row, cols.quantity)) || 1;
    const cost = parseFloat(getColumnValue(row, cols.cost)) || 0;
    const price = parseFloat(getColumnValue(row, cols.price)) || 0;
    const weight = parseFloat(getColumnValue(row, cols.weight)) || 0;
    const description = getColumnValue(row, cols.description) || "";
    
    // Validate required data
    if (price <= 0) {
      console.log(`⚠️ Skipping product with invalid price: ${sku}`);
      continue;
    }
    
    products[sku] = {
      title: title.toString().trim(),
      sku: sku.toString().trim(),
      quantity,
      cost,
      price,
      weight,
      description: description.toString().trim()
    };
    
    console.log(`➕ Added product: ${sku} - ${title}`);
  }
  
  return products;
}

function transformToShopify(products) {
  const rows = [];
  
  Object.values(products).forEach(product => {
    const row = new Array(39).fill(''); // 39 Standard Shopify columns
    
    // Generate Shopify handle
    const handle = generateHandle(product.title);
    
    // Core product info
    row[SHOPIFY_COLUMNS.handle] = handle;
    row[SHOPIFY_COLUMNS.title] = product.title;
    row[SHOPIFY_COLUMNS.body] = generateDescription(product);
    row[SHOPIFY_COLUMNS.vendor] = VENDOR_CONFIG.vendor;
    
    // Apply business rules
    row[SHOPIFY_COLUMNS.productCategory] = determineCategory(product.title);
    row[SHOPIFY_COLUMNS.type] = determineType(product.title);
    row[SHOPIFY_COLUMNS.tags] = generateTags(product.title);
    row[SHOPIFY_COLUMNS.published] = determinePublished(product.title) ? 'TRUE' : 'FALSE';
    
    // Standard options
    row[SHOPIFY_COLUMNS.option1Name] = 'Title';
    row[SHOPIFY_COLUMNS.option1Value] = 'Default Title';
    
    // Variant information
    row[SHOPIFY_COLUMNS.variantSku] = product.sku;
    row[SHOPIFY_COLUMNS.variantGrams] = product.weight;
    row[SHOPIFY_COLUMNS.variantInvTracker] = 'shopify';
    row[SHOPIFY_COLUMNS.variantInvQty] = product.quantity;
    row[SHOPIFY_COLUMNS.variantInvPolicy] = VENDOR_CONFIG.defaults.inventoryPolicy;
    row[SHOPIFY_COLUMNS.variantFulfillment] = VENDOR_CONFIG.defaults.fulfillmentService;
    row[SHOPIFY_COLUMNS.variantPrice] = product.price;
    
    // Standard settings
    row[SHOPIFY_COLUMNS.variantRequiresShipping] = VENDOR_CONFIG.defaults.requiresShipping ? 'TRUE' : 'FALSE';
    row[SHOPIFY_COLUMNS.variantTaxable] = VENDOR_CONFIG.defaults.taxable ? 'TRUE' : 'FALSE';
    row[SHOPIFY_COLUMNS.giftCard] = 'FALSE';
    row[SHOPIFY_COLUMNS.variantWeightUnit] = VENDOR_CONFIG.defaults.weightUnit;
    row[SHOPIFY_COLUMNS.costPerItem] = product.cost;
    row[SHOPIFY_COLUMNS.status] = row[SHOPIFY_COLUMNS.published] === 'TRUE' ? 'active' : 'draft';
    
    rows.push(row);
  });
  
  return rows;
}

// =====================================================
// 🔧 HELPER FUNCTIONS
// =====================================================

function getColumnValue(row, columnIndex) {
  if (columnIndex === -1 || columnIndex >= row.length) {
    return '';
  }
  return row[columnIndex] || '';
}

function generateHandle(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Multiple hyphens to single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

function generateDescription(product) {
  const strategy = VENDOR_CONFIG.contentStrategy;
  
  switch (strategy.description) {
    case 'empty':
      return '';
    case 'static':
      return strategy.htmlWrap ? `<p>${strategy.staticContent}</p>` : strategy.staticContent;
    case 'source':
      return strategy.htmlWrap ? `<p>${product.description}</p>` : product.description;
    default:
      return '';
  }
}

function determineCategory(title) {
  const titleLower = title.toLowerCase();
  
  // Apply category rules in priority order
  const sortedRules = VENDOR_CONFIG.categoryRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  for (const rule of sortedRules) {
    if (rule.keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return rule.category;
    }
  }
  
  return VENDOR_CONFIG.defaults.category;
}

function determineType(title) {
  const titleLower = title.toLowerCase();
  
  for (const rule of VENDOR_CONFIG.typeRules) {
    if (rule.keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return rule.type;
    }
  }
  
  return VENDOR_CONFIG.defaults.type;
}

function generateTags(title) {
  const titleLower = title.toLowerCase();
  const tags = [...VENDOR_CONFIG.defaults.tags]; // Start with default tags
  
  // Apply tag rules
  for (const rule of VENDOR_CONFIG.tagRules) {
    if (rule.keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      tags.push(...rule.tags);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(tags)].join(', ');
}

function determinePublished(title) {
  const titleLower = title.toLowerCase();
  
  // Check if any exclude keywords match
  const excludeKeywords = VENDOR_CONFIG.publishingRules?.excludeKeywords || [];
  for (const keyword of excludeKeywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      return false;
    }
  }
  
  return VENDOR_CONFIG.defaults.published;
}

function initializeShopifySheet(sheet) {
  // Create Standard Shopify CSV header (39 columns - no custom metafields)
  const headers = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags',
    'Published', 'Option1 Name', 'Option1 Value', 'Option1 Linked To', 'Option2 Name',
    'Option2 Value', 'Option2 Linked To', 'Option3 Name', 'Option3 Value', 'Option3 Linked To',
    'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
    'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
    'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
    'SEO Title', 'SEO Description', 'Variant Image', 'Variant Weight Unit', 
    'Variant Tax Code', 'Cost per item', 'Status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  console.log(`📋 Initialized Shopify sheet with ${headers.length} columns`);
}

// =====================================================
// 📱 GOOGLE SHEETS MENU INTEGRATION
// =====================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛍️ Shopify Import')
    .addItem('🚀 Import Products', 'importVendorProducts')
    .addItem('📋 View Configuration', 'showConfiguration')
    .addItem('❓ Help', 'showHelp')
    .addToUi();
}

function showConfiguration() {
  const ui = SpreadsheetApp.getUi();
  const config = `
Current Configuration:
📦 Vendor: ${VENDOR_CONFIG.vendor}
📄 Source Sheet: ${VENDOR_CONFIG.sourceSheet}
🎯 Target Sheet: ${VENDOR_CONFIG.targetSheet}

📊 Column Mappings:
• Title: Column ${getColumnLetter(VENDOR_CONFIG.columnMappings.title)}
• SKU: Column ${getColumnLetter(VENDOR_CONFIG.columnMappings.sku)}
• Quantity: Column ${getColumnLetter(VENDOR_CONFIG.columnMappings.quantity)}
• Price: Column ${getColumnLetter(VENDOR_CONFIG.columnMappings.price)}

🔧 To customize, edit the VENDOR_CONFIG at the top of the script.
  `;
  
  ui.alert('Current Configuration', config, ui.Button.OK);
}

function showHelp() {
  const ui = SpreadsheetApp.getUi();
  const helpText = `
🛍️ SHOPIFY IMPORT TOOLKIT HELP

📋 SETUP STEPS:
1. Edit VENDOR_CONFIG at top of script
2. Map your CSV columns to the columnMappings
3. Customize categoryRules and tagRules for your products
4. Run 'Import Products' from the menu

💡 TIPS:
• Set column to -1 if you don't have that data
• Add your own keywords to categoryRules and tagRules
• Enable duplicateHandling to prevent re-importing
• Check the console log for detailed progress

📖 For full documentation, see the GitHub repository.
  `;
  
  ui.alert('Help', helpText, ui.Button.OK);
}

function getColumnLetter(columnIndex) {
  if (columnIndex === -1) return 'Not Set';
  return String.fromCharCode(65 + columnIndex); // A, B, C, etc.
}
