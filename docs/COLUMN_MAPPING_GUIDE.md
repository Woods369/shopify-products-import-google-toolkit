# Column Mapping Guide

Configure the toolkit for any CSV format by updating the columnMapping object.

## Column Index System

Columns are numbered starting from 0:
- Column A = 0
- Column B = 1  
- Column C = 2
- Column K = 10
- Column L = 11
- etc.

## Required Fields

These fields must be mapped for the import to work:

| Field | Description | Example |
|-------|-------------|---------|
| title | Product name/title | "Rose Quartz Crystal" |
| retail | Selling price | 12.99 |

## Optional Fields

Set to -1 if your vendor doesn't provide these fields:

| Field | Description | Default if Missing |
|-------|-------------|-------------------|
| description | Product description | Empty |
| sku | Product SKU/code | Auto-generated from title |
| wholesale | Cost/wholesale price | 0 |
| quantity | Stock quantity | 1 |
| weight | Weight in grams | 0 |
| barcode | Product barcode | Empty |
| comparePrice | Compare at price | 0 |

## Configuration Examples

### Example 1: Basic Vendor Format

Your vendor's CSV has these columns:
```
A: Product Name
B: Description  
C: Date
D: Shipping
E: Wholesale Price
F: Retail Price
G: SKU
H: Stock
```

Configuration:
```javascript
columnMapping: {
  title: 0,        // Column A - Product Name
  description: 1,  // Column B - Description
  sku: 6,         // Column G - SKU
  wholesale: 4,   // Column E - Wholesale Price
  retail: 5,      // Column F - Retail Price
  quantity: 7,    // Column H - Stock
  weight: -1,     // Not provided
  barcode: -1,    // Not provided
  comparePrice: -1 // Not provided
}
```

### Example 2: Simple Inventory Format

Your spreadsheet has:
```
A: Name
B: SKU
C: Cost
D: Price
E: Qty
```

Configuration:
```javascript
columnMapping: {
  title: 0,        // Column A - Name
  description: -1, // Not provided
  sku: 1,         // Column B - SKU
  wholesale: 2,   // Column C - Cost
  retail: 3,      // Column D - Price
  quantity: 4,    // Column E - Qty
  weight: -1,     // Not provided
  barcode: -1,    // Not provided
  comparePrice: -1 // Not provided
}
```

## Finding Your Column Numbers

### Method 1: Count from A
Simply count the columns starting from A=0:
- A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, etc.

### Method 2: Use Google Sheets
1. Open your vendor data in Google Sheets
2. Click on the column header
3. The column letter is shown (A, B, C, etc.)
4. Convert to number: A=0, B=1, C=2, etc.

### Method 3: Test Configuration
Use the testConfiguration() function to verify your settings:

```javascript
function testMyConfig() {
  // Set your configuration
  const IMPORT_CONFIG = { /* your config */ };
  
  // Test it
  testConfiguration();
}
```

## Common Mistakes

### Wrong: Using 1-based indexing
```javascript
columnMapping: {
  title: 1,  // This would be Column B, not Column A
  sku: 11    // This would be Column L, not Column K
}
```

### Correct: Using 0-based indexing  
```javascript
columnMapping: {
  title: 0,  // Column A
  sku: 10    // Column K
}
```

### Wrong: Forgetting required fields
```javascript
columnMapping: {
  // Missing title and retail - import will fail
  sku: 2,
  wholesale: 3
}
```

### Correct: Including required fields
```javascript
columnMapping: {
  title: 0,     // Required
  retail: 4,    // Required
  sku: 2,
  wholesale: 3
}
```

## Troubleshooting

### "Column not found" errors
- Double-check your column numbers
- Remember columns start at 0, not 1
- Verify your vendor data has the expected columns

### "Required field missing" errors  
- Ensure title and retail are mapped to valid columns
- Check that your data actually has values in those columns

### Products not importing
- Verify column numbers are correct
- Check that required fields have data
- Use testConfiguration() to debug

## Next Steps

After configuring column mapping:
1. Set up your category rules
2. Test with a small dataset first
3. Run the full import

Need help? Check the examples in the examples/ folder for pre-configured setups.
