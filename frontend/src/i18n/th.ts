// Thai language dictionary for Supplier Management System
export const th = {
  // Common
  common: {
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    view: "ดู",
    search: "ค้นหา",
    filter: "กรอง",
    export: "ส่งออก",
    import: "นำเข้า",
    refresh: "รีเฟรช",
    back: "กลับ",
    next: "ถัดไป",
    previous: "ก่อนหน้า",
    submit: "ส่ง",
    approve: "อนุมัติ",
    reject: "ปฏิเสธ",
    confirm: "ยืนยัน",
    close: "ปิด",
    yes: "ใช่",
    no: "ไม่",
    loading: "กำลังโหลด...",
    noData: "ไม่มีข้อมูล",
    error: "เกิดข้อผิดพลาด",
    success: "สำเร็จ",
    warning: "คำเตือน",
    info: "ข้อมูล",
  },

  // Navigation
  nav: {
    dashboard: "หน้าหลัก",
    suppliers: "ผู้จำหน่ายวัตถุดิบ",
    products: "วัตถุดิบขนมหวาน",
    inventory: "คลังวัตถุดิบ",
    purchasing: "สั่งวัตถุดิบ",
    receiving: "รับวัตถุดิบ",
    requisitions: "เบิกวัตถุดิบ",
    reports: "รายงาน",
    settings: "ตั้งค่า",
    profile: "โปรไฟล์",
    logout: "ออกจากระบบ",
  },

  // User Roles
  roles: {
    PLATFORM_ADMIN: "ผู้ดูแลแพลตฟอร์ม",
    ADMIN: "ผู้ดูแลระบบ",
    CENTER: "คลังสินค้าศูนย์",
    BRANCH: "สาขา",
  },

  // Document Status
  status: {
    // PO Status
    DRAFT: "ฉบับร่าง",
    SUBMITTED: "ส่งแล้ว",
    APPROVED: "อนุมัติแล้ว",
    SENT: "ส่งไปยังผู้จำหน่าย",
    CONFIRMED: "ยืนยันแล้ว",
    PARTIALLY_RECEIVED: "รับบางส่วน",
    RECEIVED: "รับครบแล้ว",
    CLOSED: "ปิดเอกสาร",
    
    // GRN Status
    POSTED: "บันทึกแล้ว",
    
    // Requisition Status
    PARTIAL: "อนุมัติบางส่วน",
    REJECTED: "ปฏิเสธ",
    ISSUING: "กำลังจ่าย",
    COMPLETED: "เสร็จสิ้น",
  },

  // Dashboard
  dashboard: {
    title: "ระบบจัดการร้านขนม",
    subtitle: "จัดการร้านขนมครบวงจร",
    stats: {
      totalPOs: "ใบสั่งซื้อทั้งหมด",
      pendingPOs: "รอการอนุมัติ",
      totalSuppliers: "ผู้จำหน่ายทั้งหมด",
      lowStock: "สินค้าใกล้หมด",
      pendingRequisitions: "รอการเบิก",
      monthlyValue: "มูลค่าเดือนนี้",
    },
    recentActivity: "กิจกรรมล่าสุด",
    quickActions: "การดำเนินการด่วน",
    actions: {
      createPO: "สร้างใบสั่งซื้อ",
      receiveGoods: "รับสินค้า",
      createRequisition: "สร้างใบเบิก",
      viewReports: "ดูรายงาน",
    },
  },

  // Purchase Orders
  po: {
    title: "ใบสั่งซื้อ",
    create: "สร้างใบสั่งซื้อ",
    list: "รายการใบสั่งซื้อ",
    number: "เลขที่ใบสั่งซื้อ",
    date: "วันที่",
    supplier: "ผู้จำหน่าย",
    total: "รวมทั้งสิ้น",
    requestedBy: "ผู้ขอซื้อ",
    approvedBy: "ผู้อนุมัติ",
    deliveryDate: "กำหนดส่ง",
    terms: "เงื่อนไข",
    notes: "หมายเหตุ",
    status: "สถานะ",
  },

  // Suppliers
  suppliers: {
    title: "ผู้จำหน่าย",
    create: "เพิ่มผู้จำหน่าย",
    list: "รายการผู้จำหน่าย",
    name: "ชื่อผู้จำหน่าย",
    contact: "ผู้ติดต่อ",
    phone: "เบอร์โทรศัพท์",
    email: "อีเมล",
    address: "ที่อยู่",
    creditTerms: "เงื่อนไขการชำระเงิน",
    status: "สถานะ",
    active: "ใช้งาน",
    inactive: "ไม่ใช้งาน",
  },

  // Products
  products: {
    title: "วัตถุดิบขนมหวาน",
    create: "เพิ่มวัตถุดิบ",
    list: "รายการวัตถุดิบ",
    sku: "รหัสวัตถุดิบ",
    name: "ชื่อวัตถุดิบ",
    category: "หมวดหมู่",
    unit: "หน่วย",
    barcode: "บาร์โค้ด",
    minStock: "สต็อกต่ำสุด",
    maxStock: "สต็อกสูงสุด",
    currentStock: "สต็อกปัจจุบัน",
  },

  // Inventory
  inventory: {
    title: "คลังวัตถุดิบ",
    onHand: "คงเหลือ",
    allocated: "จัดสรรแล้ว",
    onPO: "สั่งซื้อแล้ว",
    location: "สถานที่",
    center: "ศูนย์",
    branch: "สาขา",
    stockMovement: "การเคลื่อนไหวสต็อก",
    stockAdjustment: "ปรับปรุงสต็อก",
  },

  // Receiving
  receiving: {
    title: "การรับวัตถุดิบ",
    create: "สร้างใบรับวัตถุดิบ",
    list: "รายการรับวัตถุดิบ",
    grnNumber: "เลขที่ใบรับสินค้า",
    poNumber: "เลขที่ใบสั่งซื้อ",
    receivedDate: "วันที่รับ",
    receivedBy: "ผู้รับ",
    quantity: "จำนวน",
    lotNumber: "เลขที่ล็อต",
    expiryDate: "วันหมดอายุ",
    remarks: "หมายเหตุ",
  },

  // Requisitions
  requisitions: {
    title: "การเบิกวัตถุดิบ",
    create: "สร้างใบเบิก",
    list: "รายการใบเบิก",
    number: "เลขที่ใบเบิก",
    branch: "สาขา",
    requestedBy: "ผู้เบิก",
    requestedDate: "วันที่เบิก",
    reason: "เหตุผล",
    priority: "ความสำคัญ",
    high: "สูง",
    medium: "ปานกลาง",
    low: "ต่ำ",
    urgent: "ด่วน",
  },

  // Forms
  forms: {
    required: "จำเป็นต้องกรอก",
    invalid: "ข้อมูลไม่ถูกต้อง",
    minLength: "กรุณากรอกอย่างน้อย {min} ตัวอักษร",
    maxLength: "กรุณากรอกไม่เกิน {max} ตัวอักษร",
    email: "รูปแบบอีเมลไม่ถูกต้อง",
    phone: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง",
    number: "กรุณากรอกตัวเลขเท่านั้น",
    positive: "กรุณากรอกตัวเลขมากกว่า 0",
  },

  // Messages
  messages: {
    saveSuccess: "บันทึกข้อมูลสำเร็จ",
    deleteSuccess: "ลบข้อมูลสำเร็จ",
    updateSuccess: "อัปเดตข้อมูลสำเร็จ",
    deleteConfirm: "คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?",
    cannotDelete: "ไม่สามารถลบข้อมูลได้ เนื่องจากมีการใช้งานอยู่",
    networkError: "เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง",
    serverError: "เกิดข้อผิดพลาดเซิร์ฟเวอร์",
    unauthorized: "ไม่มีสิทธิ์เข้าถึง",
    sessionExpired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  },

  // Date/Time
  dateTime: {
    today: "วันนี้",
    yesterday: "เมื่อวาน",
    tomorrow: "พรุ่งนี้",
    thisWeek: "สัปดาห์นี้",
    thisMonth: "เดือนนี้",
    thisYear: "ปีนี้",
    days: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
    months: [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ],
  },

  // Notifications
  notifications: {
    title: "การแจ้งเตือน",
    markAsRead: "ทำเครื่องหมายว่าอ่านแล้ว",
    markAllAsRead: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว",
    noNotifications: "ไม่มีการแจ้งเตือน",
    poApproved: "ใบสั่งซื้อได้รับอนุมัติแล้ว",
    poRejected: "ใบสั่งซื้อถูกปฏิเสธ",
    requisitionApproved: "ใบเบิกได้รับอนุมัติแล้ว",
    goodsReceived: "ได้รับสินค้าแล้ว",
    lowStockAlert: "สินค้าใกล้หมด",
  },
};

export default th;