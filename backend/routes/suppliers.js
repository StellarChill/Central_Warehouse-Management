const express = require('express');
const router = express.Router();

// Mock suppliers data
let suppliers = [
  {
    id: 1,
    name: "บริษัท น้ำดื่ม จำกัด",
    contactPerson: "สมชาย ใจดี",
    phone: "02-123-4567",
    email: "contact@watercompany.co.th",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    category: "เครื่องดื่ม",
    status: "ACTIVE",
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "ร้านข้าวสาร ดี",
    contactPerson: "สมหญิง รักดี",
    phone: "02-234-5678",
    email: "info@ricegood.com",
    address: "456 ถนนลาดพร้าว กรุงเทพฯ 10230",
    category: "อาหารแห้ง",
    status: "ACTIVE",
    rating: 4.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "ฟาร์มโคนม ไทย",
    contactPerson: "วิชัย เกษตรกร",
    phone: "02-345-6789",
    email: "milk@thaidairy.com",
    address: "789 ถนนรัชดาภิเษก กรุงเทพฯ 10400",
    category: "นมและผลิตภัณฑ์",
    status: "ACTIVE",
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    name: "สวนผักสด ดี",
    contactPerson: "สุดา เกษตรกร",
    phone: "02-456-7890",
    email: "fresh@veggiegarden.com",
    address: "321 ถนนวิภาวดีรังสิต กรุงเทพฯ 10900",
    category: "ผักและผลไม้",
    status: "ACTIVE",
    rating: 4.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/suppliers - Get all suppliers
router.get('/', (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let filteredSuppliers = [...suppliers];
    
    // Filter by category
    if (category) {
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Filter by status
    if (status) {
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.status === status.toUpperCase()
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm) ||
        supplier.category.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: filteredSuppliers,
      total: filteredSuppliers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers',
      message: error.message
    });
  }
});

// GET /api/suppliers/:id - Get specific supplier
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const supplier = suppliers.find(supplier => supplier.id === parseInt(id));
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier',
      message: error.message
    });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, category } = req.body;
    
    // Validation
    if (!name || !contactPerson || !phone || !email || !address || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, contactPerson, phone, email, address, category'
      });
    }
    
    // Check if supplier already exists
    const existingSupplier = suppliers.find(supplier => 
      supplier.name.toLowerCase() === name.toLowerCase()
    );
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: 'Supplier with this name already exists'
      });
    }
    
    const newSupplier = {
      id: suppliers.length + 1,
      name,
      contactPerson,
      phone,
      email,
      address,
      category,
      status: "ACTIVE",
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    suppliers.push(newSupplier);
    
    res.status(201).json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier',
      message: error.message
    });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const supplierIndex = suppliers.findIndex(supplier => supplier.id === parseInt(id));
    
    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    const updatedSupplier = {
      ...suppliers[supplierIndex],
      ...req.body,
      id: parseInt(id), // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    suppliers[supplierIndex] = updatedSupplier;
    
    res.json({
      success: true,
      data: updatedSupplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier',
      message: error.message
    });
  }
});

// DELETE /api/suppliers/:id - Delete supplier (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const supplierIndex = suppliers.findIndex(supplier => supplier.id === parseInt(id));
    
    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    // Soft delete - change status to INACTIVE
    suppliers[supplierIndex].status = "INACTIVE";
    suppliers[supplierIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Supplier deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier',
      message: error.message
    });
  }
});

// GET /api/suppliers/stats/summary - Get supplier statistics
router.get('/stats/summary', (req, res) => {
  try {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'ACTIVE').length;
    const inactiveSuppliers = suppliers.filter(supplier => supplier.status === 'INACTIVE').length;
    const averageRating = suppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / suppliers.length;
    
    const stats = {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      averageRating: averageRating.toFixed(1),
      categories: [...new Set(suppliers.map(supplier => supplier.category))]
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier statistics',
      message: error.message
    });
  }
});

module.exports = router;
