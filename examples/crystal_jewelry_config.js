// Crystal & Jewelry Business Configuration
const CRYSTAL_JEWELRY_CONFIG = {
  sourceSheetName: "CrystalVendorData",
  targetSheetName: "shopify_products", 
  vendorName: "Crystal Healing Co",
  
  columnMapping: {
    title: 0,          // A - Title
    description: 1,    // B - Description  
    sku: 10,           // K - SKU
    wholesale: 5,      // F - Price Wholesale
    retail: 6,         // G - Price Retail
    quantity: 11,      // L - Quantity
    weight: -1,
    barcode: -1,
    comparePrice: -1
  },
  
  
  categoryRules: [
    {
      keywords: ["necklace", "pendant"],
      category: "Apparel & Accessories > Jewelry",
      type: "Necklace"
    },
    {
      keywords: ["crystal", "healing"],
      category: "Arts & Entertainment > Arts & Crafts",
      type: "Crystal"
    }
  ]
};
