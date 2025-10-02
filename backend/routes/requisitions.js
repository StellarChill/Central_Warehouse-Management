const express = require('express');
const router = express.Router();

// Mock data for requisitions
let requisitions = [
  { 
    id: "REQ-2024-089", 
    branch: "สาขาลาดพร้าว", 
    requestedBy: "วิชาญ", 
    status: "PENDING", 
    items: [
      { name: "น้ำดื่ม 600ml", qty: 100, unit: "ขวด" }, 
      { name: "ข้าวสาร 5kg", qty: 20, unit: "ถุง" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: "REQ-2024-090", 
    branch: "สาขาบางนา", 
    requestedBy: "สุดา", 
    status: "PREPARING", 
    items: [
      { name: "นม 1L", qty: 60, unit: "กล่อง" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: "REQ-2024-091", 
    branch: "สาขาหาดใหญ่", 
    requestedBy: "ปรีชา", 
    status: "SHIPPED", 
    items: [
      { name: "ผักรวม แพ็ค", qty: 30, unit: "แพ็ค" }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/requisitions - Get all requisitions
router.get('/', (req, res) => {
  try {
    const { status, branch, search } = req.query;
    
    let filteredRequisitions = [...requisitions];
    
    // Filter by status
    if (status) {
      filteredRequisitions = filteredRequisitions.filter(req => req.status === status);
    }
    
    // Filter by branch
    if (branch) {
      filteredRequisitions = filteredRequisitions.filter(req => 
        req.branch.toLowerCase().includes(branch.toLowerCase())
      );
    }
    
    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredRequisitions = filteredRequisitions.filter(req => 
        req.id.toLowerCase().includes(searchTerm) ||
        req.branch.toLowerCase().includes(searchTerm) ||
        req.requestedBy.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: filteredRequisitions,
      total: filteredRequisitions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requisitions',
      message: error.message
    });
  }
});

// GET /api/requisitions/:id - Get specific requisition
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const requisition = requisitions.find(req => req.id === id);
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    res.json({
      success: true,
      data: requisition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requisition',
      message: error.message
    });
  }
});

// POST /api/requisitions - Create new requisition
router.post('/', (req, res) => {
  try {
    const { branch, requestedBy, items } = req.body;
    
    // Validation
    if (!branch || !requestedBy || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: branch, requestedBy, items'
      });
    }
    
    // Generate new ID
    const newId = `REQ-2024-${String(requisitions.length + 1).padStart(3, '0')}`;
    
    const newRequisition = {
      id: newId,
      branch,
      requestedBy,
      items,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    requisitions.push(newRequisition);
    
    res.status(201).json({
      success: true,
      data: newRequisition,
      message: 'Requisition created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create requisition',
      message: error.message
    });
  }
});

// PUT /api/requisitions/:id/approve - Approve requisition
router.put('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const requisition = requisitions.find(req => req.id === id);
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    if (requisition.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requisitions can be approved'
      });
    }
    
    requisition.status = 'PREPARING';
    requisition.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: requisition,
      message: 'Requisition approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to approve requisition',
      message: error.message
    });
  }
});

// PUT /api/requisitions/:id/reject - Reject requisition
router.put('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const requisition = requisitions.find(req => req.id === id);
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    if (requisition.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requisitions can be rejected'
      });
    }
    
    requisition.status = 'REJECTED';
    requisition.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: requisition,
      message: 'Requisition rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reject requisition',
      message: error.message
    });
  }
});

// PUT /api/requisitions/:id/ship - Mark as shipped
router.put('/:id/ship', (req, res) => {
  try {
    const { id } = req.params;
    const requisition = requisitions.find(req => req.id === id);
    
    if (!requisition) {
      return res.status(404).json({
        success: false,
        error: 'Requisition not found'
      });
    }
    
    if (requisition.status !== 'PREPARING') {
      return res.status(400).json({
        success: false,
        error: 'Only preparing requisitions can be shipped'
      });
    }
    
    requisition.status = 'SHIPPED';
    requisition.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: requisition,
      message: 'Requisition marked as shipped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to ship requisition',
      message: error.message
    });
  }
});

// GET /api/requisitions/stats/summary - Get requisition statistics
router.get('/stats/summary', (req, res) => {
  try {
    const stats = {
      total: requisitions.length,
      pending: requisitions.filter(req => req.status === 'PENDING').length,
      preparing: requisitions.filter(req => req.status === 'PREPARING').length,
      shipped: requisitions.filter(req => req.status === 'SHIPPED').length,
      rejected: requisitions.filter(req => req.status === 'REJECTED').length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;
