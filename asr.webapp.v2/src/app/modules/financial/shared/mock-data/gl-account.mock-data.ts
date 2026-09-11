// Mirrors the shape of FinancialCategory (financial/category/category.types.ts),
// flattened to leaf accounts only. Dev/demo seed data — real mode reuses
// FinancialCategoryService.getCategoryTree() flattened the same way.
export interface MockGlAccount {
    financialCategoryId: number;
    financialCategoryCode: string;
    financialCategoryName: string;
    nature: number; // 1: Debit, 2: Credit, 3: Both
}

export const MOCK_GL_ACCOUNTS: MockGlAccount[] = [
    { financialCategoryId: -201, financialCategoryCode: '6100', financialCategoryName: 'Office Supplies Expense', nature: 1 },
    { financialCategoryId: -202, financialCategoryCode: '6200', financialCategoryName: 'IT & Software Expense', nature: 1 },
    { financialCategoryId: -203, financialCategoryCode: '6300', financialCategoryName: 'Travel Expense', nature: 1 },
    { financialCategoryId: -204, financialCategoryCode: '6400', financialCategoryName: 'Utilities Expense', nature: 1 },
    { financialCategoryId: -205, financialCategoryCode: '6500', financialCategoryName: 'Professional Services', nature: 1 },
    { financialCategoryId: -206, financialCategoryCode: '2100', financialCategoryName: 'Accounts Payable', nature: 2 },
];
