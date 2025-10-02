const express = require('express');
const router = express.Router();

// Mock inventory data
let inventory = [
  {
    id: 1,
    sku: "WATER-600ML",
    name: "น้ำดื่ม 600ml",
    category: "เครื่องดื่ม",
    currentStock: 500,
    minStock: 100,
    maxStock: 1000,
    unit: "ขวด",
    price: 8.50,
    supplier: "บริษัท น้ำดื่ม จำกัด",
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    sku: "RICE-5KG",
    name: "ข้าวสาร 5kg",
    category: "อาหารแห้ง",
    currentStock: 200,
    minStock: 50,
    maxStock: 500,
    unit: "ถุง",
    price: 180.00,
    supplier: "ร้านข้าวสาร ดี",
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    sku: "MILK-1L",
    name: "นม 1L",
    category: "นมและผลิตภัณฑ์",
    currentStock: 150,
    minStock: 30,
    maxStock: 300,
    unit: "กล่อง",
    price: 45.00,
    supplier: "ฟาร์มโคนม ไทย",
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    sku: "VEGGIE-MIX",
    name: "ผักรวม แพ็ค",
    category: "ผักและผลไม้",
    currentStock: 80,
    minStock: 20,
    maxStock: 200,
    unit: "แพ็ค",
    price: 25.00,
    supplier: "สวนผักสด ดี",
    lastUpdated: new Date().toISOString()
  }
];

// GET /api/inventory - Get all inventory items
router.get('/', (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    
    let filteredInventory = [...inventory];
    
    // Filter by category
    if (category) {
      filteredInventory = filteredInventory.filter(item => 
        item.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Filter low stock items
    if (lowStock === 'true') {
      filteredInventory = filteredInventory.filter(item => 
        item.currentStock <= item.minStock
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredInventory = filteredInventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: filteredInventory,
      total: filteredInventory.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    });
  }
});

// GET /api/inventory/:id - Get specific inventory item
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = inventory.find(item => item.id === parseInt(id));
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item',
      message: error.message
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', (req, res) => {
  try {
    const { sku, name, category, currentStock, minStock, maxStock, unit, price, supplier } = req.body;
    
    // Validation
    if (!sku || !name || !category || currentStock === undefined || !unit || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sku, name, category, currentStock, unit, price'
      });
    }
    
    // Check if SKU already exists
    const existingItem = inventory.find(item => item.sku === sku);
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists'
      });
    }
    
    const newItem = {
      id: inventory.length + 1,
      sku,
      name,
      category,
      currentStock: parseInt(currentStock),
      minStock: parseInt(minStock) || 0,
      maxStock: parseInt(maxStock) || 1000,
      unit,
      price: parseFloat(price),
      supplier: supplier || '',
      lastUpdated: new Date().toISOString()
    };
    
    inventory.push(newItem);
    
    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item',
      message: error.message
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const itemIndex = inventory.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    const updatedItem = {
      ...inventory[itemIndex],
      ...req.body,
      id: parseInt(id), // Ensure ID doesn't change
      lastUpdated: new Date().toISOString()
    };
    
    inventory[itemIndex] = updatedItem;
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item',
      message: error.message
    });
  }
});

// PUT /api/inventory/:id/adjust - Adjust stock quantity
router.put('/:id/adjust', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required'
      });
    }
    
    const itemIndex = inventory.findIndex(item => item.id === parseInt(id));
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    const newStock = inventory[itemIndex].currentStock + parseInt(quantity);
    
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock for this adjustment'
      });
    }
    
    inventory[itemIndex].currentStock = newStock;
    inventory[itemIndex].lastUpdated = new Date().toISOString();
    
    res.json({
      success: true,
      data: inventory[itemIndex],
      message: `Stock adjusted by ${quantity}. New stock: ${newStock}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to adjust stock',
      message: error.message
    });
  }
});

// GET /api/inventory/stats/summary - Get inventory statistics
router.get('/stats/summary', (req, res) => {
  try {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock).length;
    const outOfStockItems = inventory.filter(item => item.currentStock === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
    
    const stats = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue: totalValue.toFixed(2),
      categories: [...new Set(inventory.map(item => item.category))]
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory statistics',
      message: error.message
    });
  }
});

module.exports = router;
