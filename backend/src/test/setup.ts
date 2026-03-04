/**
 * Jest setup: Mock prisma client
 * Mock ทุก method ที่ receiptController ใช้จริง
 */

// Build the mock so that $transaction passes the same mock as `tx`
const prismaMockObj: any = {
    purchaseOrder: {
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    purchaseOrderDetail: {
        findMany: jest.fn(),
    },
    warehouse: {
        findFirst: jest.fn(),
    },
    receipt: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),  // ← generateReceiptCode ใช้ findMany
        delete: jest.fn(),
    },
    receiptDetail: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        groupBy: jest.fn(),   // ← getReceivedSumMap ใช้ groupBy
    },
    stock: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
    },
    // $transaction: callback receives the same mock object as `tx`
    $transaction: jest.fn((callback: any) => callback(prismaMockObj)),
};

jest.mock('../prisma', () => ({
    __esModule: true,
    default: prismaMockObj,
}));

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire $transaction to always pass the mock as tx
    prismaMockObj.$transaction.mockImplementation((cb: any) => cb(prismaMockObj));
});
