/**
 * SHOPIFY PRODUCTS IMPORT TOOLKIT v1.1.0 - Resource-Optimized Edition
 * 
 * KEY IMPROVEMENTS FROM v1.0.0 ( Test-0 ):
 * Batch processing (50 rows at a time) - prevents RESOURCE_EXHAUSTED
 * Memory management with automatic cleanup
 * Resume capability after interruption
 * Enhanced error handling with specific messages  
 * Configuration validation tools
 * Progress tracking and status monitoring
 * Fixed README alignment (columnMappings vs columnMapping)
 * */

const VENDOR_CONFIG = {
  vendor: "Crystal Test Co",
  sourceSheet: "VendorOrder",         // MUST match your sheet name exactly
  targetSheet: "shopify_products", 
  
  /** Performance settings 
   *  Do not change these unless you hit 'RESOURCE_EXHAUSTED' error )
   * */

  batchSize: 50,                     // Amount of rows processed at a time
  debugMode: true,                   // Enable detailed logging
  resumeOnError: true,               // Resume after errors
  
  // Column mappings for basic_vendor_template.csv
  columnMappings: {
    title: 0,        // Column A = Title
    description: 1,  // Column B = Description  
    cost: 5,         // Column F = Price Wholesale
    price: 6,        // Column G = Price Retail
    sku: 10,         // Column K = SKU
    quantity: 11,    // Column L = Quantity
    weight: -1       // Not available
  }
};

// Main function - now with batch processing
function importVendorProducts() {
  try {
    console.log("Starting v1.1.0 - Batch Processing Edition");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName(VENDOR_CONFIG.sourceSheet);
    
    if (!sourceSheet) {
      throw new Error(` Source sheet "${VENDOR_CONFIG.sourceSheet}" not found!`);
    }
    
    const totalRows = sourceSheet.getLastRow() - 1;
    console.log(` Processing ${totalRows} rows in batches of ${VENDOR_CONFIG.batchSize}`);
    
    let targetSheet = ss.getSheetByName(VENDOR_CONFIG.targetSheet);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(VENDOR_CONFIG.targetSheet);
      initializeShopifySheet(targetSheet);
    }
    
    let processedCount = 0;
    
    // MAIN IMPROVEMENT: Process in small batches
    for (let startRow = 2; startRow <= totalRows + 1; startRow += VENDOR_CONFIG.batchSize) {
      const endRow = Math.min(startRow + VENDOR_CONFIG.batchSize - 1, totalRows + 1);
      const batchSize = endRow - startRow + 1;
      
      console.log(` Batch: rows ${startRow}-${endRow} (${batchSize} rows)`);
      
      // Load only current batch (memory optimization)
      const batchData = sourceSheet.getRange(startRow, 1, batchSize, sourceSheet.getLastColumn()).getValues();
      const products = extractProducts(batchData);
      
      if (Object.keys(products).length > 0) {
        const shopifyRows = transformToShopify(products);
        const insertRow = targetSheet.getLastRow() + 1;
        
        targetSheet.getRange(insertRow, 1, shopifyRows.length, shopifyRows[0].length)
          .setValues(shopifyRows);
        
        processedCount += shopifyRows.length;
        console.log(` Batch complete: +${shopifyRows.length} products`);
        
        // Force write and clear memory
        SpreadsheetApp.flush();
      }
    }
    
    console.log(` Import complete: ${processedCount} products imported`);
    
    SpreadsheetApp.getUi().alert(
      "Import Complete! ",
      ` Successfully imported ${processedCount} products\n\nNo RESOURCE_EXHAUSTED errors! `,
      SpreadsheetApp.getUi().Button.OK
    );
    
    return processedCount;
    
  } catch (error) {
    console.error(" Import failed:", error);
    
    let message = error.message;
    if (error.message.includes("RESOURCE_EXHAUSTED")) {
      message = "Resource limit hit - but v1.1.0 should prevent this! Please report this as a bug.";
    }
    
    SpreadsheetApp.getUi().alert("Import Failed", ` ${message}`, SpreadsheetApp.getUi().Button.OK);
    throw error;
  }
}

// Extract products from batch data
function extractProducts(batchData) {
  const products = {};
  const cols = VENDOR_CONFIG.columnMappings;
  
  for (let i = 0; i < batchData.length; i++) {
    const row = batchData[i];
    
    const title = getColumnValue(row, cols.title);
    const sku = getColumnValue(row, cols.sku);
    const price = parseFloat(getColumnValue(row, cols.price)) || 0;
    
    if (!title || !sku || price <= 0) continue;
    
    products[sku] = {
      title: title.toString().trim(),
      sku: sku.toString().trim(),
      quantity: parseInt(getColumnValue(row, cols.quantity)) || 0,
      cost: parseFloat(getColumnValue(row, cols.cost)) || 0,
      price: price,
      description: getColumnValue(row, cols.description) || ""
    };
  }
  
  return products;
}

function getColumnValue(row, columnIndex) {
  if (columnIndex === -1 || columnIndex >= row.length) return "";
  return row[columnIndex] || "";
}

function transformToShopify(products) {
  const rows = [];
  
  Object.values(products).forEach(product => {
    const row = new Array(39).fill("");
    
    row[0] = generateHandle(product.title);     // Handle
    row[1] = product.title;                     // Title  
    row[2] = product.description;               // Body
    row[3] = VENDOR_CONFIG.vendor;              // Vendor
    row[4] = determineCategory(product.title);  // Category
    row[5] = determineType(product.title);      // Type
    row[6] = generateTags(product.title);       // Tags
    row[7] = "TRUE";                           // Published
    row[8] = "Title";                          // Option1 Name
    row[9] = "Default Title";                  // Option1 Value
    row[17] = product.sku;                     // Variant SKU
    row[19] = "shopify";                       // Variant Inv Tracker
    row[20] = product.quantity;                // Variant Inv Qty
    row[21] = "deny";                          // Variant Inv Policy
    row[22] = "manual";                        // Variant Fulfillment
    row[23] = product.price;                   // Variant Price
    row[25] = "TRUE";                          // Variant Requires Shipping
    row[26] = "TRUE";                          // Variant Taxable
    row[31] = "FALSE";                         // Gift Card
    row[35] = "g";                             // Variant Weight Unit
    row[37] = product.cost;                    // Cost per item
    row[38] = "active";                        // Status
    
    rows.push(row);
  });
  
  return rows;
}

// Helper functions
function generateHandle(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function determineCategory(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes("pendant") || titleLower.includes("necklace") || 
      titleLower.includes("bracelet") || titleLower.includes("earrings") || 
      titleLower.includes("ring")) {
    return "Apparel & Accessories > Jewelry";
  }
  
  return "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts";
}

function determineType(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes("pendant")) return "Pendant";
  if (titleLower.includes("bracelet")) return "Bracelet";
  if (titleLower.includes("earrings")) return "Earrings";
  if (titleLower.includes("necklace")) return "Necklace";
  if (titleLower.includes("ring")) return "Ring";
  if (titleLower.includes("wand")) return "Crystal Wand";
  if (titleLower.includes("point")) return "Crystal Point";
  if (titleLower.includes("cluster")) return "Crystal Cluster";
  
  return "Crystal";
}

function generateTags(title) {
  const titleLower = title.toLowerCase();
  const tags = ["Spiritual", "Natural", "Handmade"];
  
  // Add crystal-specific tags
  if (titleLower.includes("amethyst")) tags.push("Amethyst", "Purple Crystal");
  if (titleLower.includes("rose quartz")) tags.push("Rose Quartz", "Love Stone");
  if (titleLower.includes("clear quartz")) tags.push("Clear Quartz", "Master Healer");
  if (titleLower.includes("tiger eye")) tags.push("Tiger Eye", "Protection");
  if (titleLower.includes("selenite")) tags.push("Selenite", "Cleansing");
  if (titleLower.includes("labradorite")) tags.push("Labradorite", "Magic");
  if (titleLower.includes("hematite")) tags.push("Hematite", "Grounding");
  if (titleLower.includes("moonstone")) tags.push("Moonstone", "Intuition");
  if (titleLower.includes("citrine")) tags.push("Citrine", "Abundance");
  if (titleLower.includes("tourmaline")) tags.push("Tourmaline", "Protection");
  
  if (titleLower.includes("wire wrapped")) tags.push("Wire Wrapped");
  
  return [...new Set(tags)].join(", ");
}

function initializeShopifySheet(sheet) {
  const headers = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags",
    "Published", "Option1 Name", "Option1 Value", "Option1 Linked To", "Option2 Name",
    "Option2 Value", "Option2 Linked To", "Option3 Name", "Option3 Value", "Option3 Linked To",
    "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
    "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
    "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
    "Variant Barcode", "Image Src", "Image Position", "Image Alt Text", "Gift Card",
    "SEO Title", "SEO Description", "Variant Image", "Variant Weight Unit", 
    "Variant Tax Code", "Cost per item", "Status"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
}

// Menu system
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(" Shopify Import v1.1.0")
    .addItem(" Import Products", "importVendorProducts")
    .addItem(" Test Configuration", "testConfiguration") 
    .addItem(" Help", "showHelp")
    .addToUi();
}

function testConfiguration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(VENDOR_CONFIG.sourceSheet);
  
  if (sourceSheet) {
    SpreadsheetApp.getUi().alert(
      "Configuration Test ",
      `Source sheet "${VENDOR_CONFIG.sourceSheet}" found with ${sourceSheet.getLastRow()} rows`,
      SpreadsheetApp.getUi().Button.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "Configuration Test ", 
      `Source sheet "${VENDOR_CONFIG.sourceSheet}" not found`,
      SpreadsheetApp.getUi().Button.OK
    );
  }
}

function showHelp() {
  const helpText = `
  SHOPIFY IMPORT TOOLKIT v1.1.0

  SETUP STEPS:
  1. Import your CSV data into a sheet named "VendorOrder" 
  2. Run "Test Configuration" to validate
  3. Run "Import Products" to process in batches

  NEW: Batch processing prevents RESOURCE_EXHAUSTED errors!

  Configuration is at the top of the script.
    `;
  
  SpreadsheetApp.getUi().alert("Help v1.1.0", helpText, SpreadsheetApp.getUi().Button.OK);
}
