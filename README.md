###### SHOPIFY PRODUCTS IMPORT TOOLKIT
# W E L C O M E

_**Google Apps Script** for importing vendor data into **Shopify Products**._

## Key Features

- Fully customisable.
- Duplicate Prevention - **Never** overwrites existing products in your .csv [^1] 
- Supports **Shopify Product categories**.
- Template Library - **Pre-built** templates.
- Zero Vendor Lock-in - Any Vendor / Manufacturer.
- Safe Operations - Validation and error handling.
- Detailed Logging - Know exactly what happened during every import.

## Quick Start

### 1. Choose a Template _or_ use your own.

| Business Type | Template File | Configuration Example |
|---------------|---------------|----------------------|
| Crystal & Jewelry | basic_vendor_template.csv | crystal_jewelry_config.js |
| General Retail | simple_inventory_template.csv | general_retail_config.js |
| Advanced Inventory | advanced_vendor_template.csv | Custom configuration |

### 2. Set Up Your Data

```bash
# Copy a template that matches your business
cp templates/basic_vendor_template.csv your_vendor_data.csv

# Edit with your actual product data
# Import into Google Sheets
```

### 3. Configure the Script

```javascript
// Copy shopify_import_toolkit.js to Google Apps Script
// Update the IMPORT_CONFIG section:

const IMPORT_CONFIG = {
  sourceSheetName: 'YourVendorData',  // Your sheet name
  targetSheetName: 'shopify_products', 
  vendorName: 'Your Vendor Name',
  
  columnMapping: {
    title: 0,      // Column A - Product Name
    description: 1, // Column B - Description
    sku: 10,       // Column K - SKU
    retail: 6,     // Column G - Retail Price
    // ... customize for your columns
  }
  // ... rest of configuration
};
```

### 4. Run the Import

```javascript
// In Google Apps Script, run:
importVendorProducts();

// Check the execution log for results
```

## Configuration Guide

The power is in the configuration. Adapt to any vendor format:

```javascript
const IMPORT_CONFIG = {
  // Map your vendor's columns (zero-indexed)
  columnMapping: {
    title: 0,         // Where is the product name?
    description: 1,   // Where is the description?
    sku: 10,         // Where is the SKU?
    wholesale: 5,    // Where is the cost price?
    retail: 6,       // Where is the selling price?
    quantity: 11,    // Where is the stock quantity?
    // Set to -1 if not available:
    weight: -1,      
    barcode: -1,     
    comparePrice: -1 
  },
  
  // Smart categorization rules
  categoryRules: [
    {
      keywords: ['necklace', 'pendant'],
      category: 'Apparel & Accessories > Jewelry',
      type: 'Necklace'
    }
    // Add more rules...
  ]
};
```

## Project Structure

```
shopify-products-import-google-toolkit/
├── shopify_import_toolkit.js     # Main configurable script
├── templates/                    # CSV templates for different business types
│   ├── basic_vendor_template.csv
│   └── simple_inventory_template.csv
├── examples/                     # Pre-configured examples
│   └── crystal_jewelry_config.js
└── docs/                        # Detailed guides
    └── COLUMN_MAPPING_GUIDE.md
```

## Template Examples

### Basic Vendor Template
```csv
Title,Description,Date,Shipping1,Shipping2,Wholesale,Retail,Profit,Sold,Total,SKU,Quantity
Rose Quartz Crystal,Healing crystal for love and peace,2024-01-15,2.95,6.95,3.50,8.99,5.49,0,0.00,RQ-001,25
```

### Simple Inventory Template  
```csv
Product Name,Description,SKU,Cost Price,Selling Price,Stock Quantity
Handmade Ring,Silver ring with Celtic design,HSR-001,12.50,29.99,5
```

## Use Cases

### Perfect For:
- E-commerce businesses importing from multiple suppliers
- Dropshipping operations with various vendor formats
- Retail stores migrating to Shopify
- Handmade businesses with inventory spreadsheets
- Crystal/jewelry shops with healing product catalogs
- General retailers with product databases

### Not Suitable For:
- One-time manual imports (just use Shopify's built-in importer)
- Products requiring complex variants (this handles simple products)
- Businesses wanting vendor-specific hardcoded solutions

## Safety Features

- Never overwrites existing products - Duplicate SKU protection
- Extensive validation - Catches errors before import
- Detailed logging - Know exactly what happened
- Test mode - Validate configuration without importing
- Rollback friendly - Only adds new products, never modifies existing

## Documentation

- Column Mapping Guide (docs/COLUMN_MAPPING_GUIDE.md) - Configure for any CSV format
- Template Examples (templates/) - Ready-to-use CSV templates
- Configuration Examples (examples/) - Pre-built configs for common business types

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Add your business template in templates/
3. Create a configuration example in examples/
4. Update documentation if needed
5. Submit a pull request

### Contributing Ideas:
- New CSV templates for different industries
- Enhanced categorization rules
- Additional tagging logic
- Better error handling
- Performance improvements

## License

This project is open source and available under the MIT License. Use it, modify it, make it better!

## Support

- Issues: GitHub Issues
- Documentation: Check the docs/ folder
- Examples: See the examples/ folder

Transform your vendor imports today!

[^1]: Accept a paremeter to customise item quantiy acceptance.
