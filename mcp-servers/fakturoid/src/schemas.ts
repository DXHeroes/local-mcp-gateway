/**
 * Zod input schemas for all Fakturoid MCP tools
 */

import { z } from 'zod';

// ── Account ────────────────────────────────────────────────────────

export const EmptySchema = z.object({});

// ── Invoices ───────────────────────────────────────────────────────

export const ListInvoicesSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter invoices updated since this date (ISO 8601)'),
  updated_since: z.string().optional().describe('Filter invoices updated since this datetime'),
  number: z.string().optional().describe('Filter by invoice number'),
  status: z
    .enum(['open', 'sent', 'overdue', 'paid', 'cancelled'])
    .optional()
    .describe('Filter by invoice status'),
  subject_id: z.number().int().positive().optional().describe('Filter by subject/contact ID'),
});

export const GetInvoiceSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
});

const InvoiceLineSchema = z.object({
  name: z.string().describe('Line item name/description'),
  quantity: z.number().optional().describe('Quantity (default: 1)'),
  unit_name: z.string().optional().describe('Unit name (e.g., "ks", "hod", "pcs")'),
  unit_price: z.number().describe('Unit price (without VAT)'),
  vat_rate: z.number().optional().describe('VAT rate percentage (e.g., 21, 15, 10, 0)'),
});

export const CreateInvoiceSchema = z.object({
  subject_id: z.number().int().positive().describe('Subject/contact ID for the invoice'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code (e.g., "CZK", "EUR", "USD")'),
  due: z.number().int().optional().describe('Due in days (default: 14)'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD, default: today)'),
  taxable_fulfillment_due: z
    .string()
    .optional()
    .describe('Date of taxable fulfillment (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note displayed on the invoice'),
  lines: z.array(InvoiceLineSchema).min(1).describe('Invoice line items'),
  tags: z.array(z.string()).optional().describe('Tags for the invoice'),
});

export const UpdateInvoiceSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code'),
  due: z.number().int().optional().describe('Due in days'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note displayed on the invoice'),
  lines: z.array(InvoiceLineSchema).optional().describe('Invoice line items (replaces existing)'),
  tags: z.array(z.string()).optional().describe('Tags for the invoice'),
});

export const InvoiceActionSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
  event: z
    .enum([
      'mark_as_sent',
      'deliver',
      'pay',
      'pay_proforma',
      'pay_partial_proforma',
      'remove_payment',
      'deliver_reminder',
      'cancel',
      'undo_cancel',
      'lock',
      'unlock',
    ])
    .describe('Invoice event/action to fire'),
  paid_on: z.string().optional().describe('Payment date for pay event (YYYY-MM-DD)'),
  paid_amount: z.number().optional().describe('Partial payment amount (for pay_partial_proforma)'),
});

export const SearchInvoicesSchema = z.object({
  query: z.string().min(1).describe('Search query (searches invoice number, subject name, etc.)'),
  page: z.number().int().positive().optional().describe('Page number'),
});

// ── Subjects (Contacts) ───────────────────────────────────────────

export const ListSubjectsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter subjects updated since this date'),
  updated_since: z.string().optional().describe('Filter subjects updated since this datetime'),
});

export const GetSubjectSchema = z.object({
  id: z.number().int().positive().describe('Subject ID'),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(1).describe('Subject/company name'),
  street: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  zip: z.string().optional().describe('ZIP/postal code'),
  country: z.string().optional().describe('Country code (e.g., "CZ", "SK")'),
  registration_no: z.string().optional().describe('Company registration number (ICO)'),
  vat_no: z.string().optional().describe('VAT number (DIC, e.g., "CZ12345678")'),
  email: z.string().optional().describe('Contact email'),
  phone: z.string().optional().describe('Contact phone'),
  web: z.string().optional().describe('Website URL'),
  bank_account: z.string().optional().describe('Bank account number'),
  iban: z.string().optional().describe('IBAN'),
  note: z.string().optional().describe('Internal note'),
});

export const SearchSubjectsSchema = z.object({
  query: z.string().min(1).describe('Search query (searches name, registration_no, etc.)'),
  page: z.number().int().positive().optional().describe('Page number'),
});

export const UpdateSubjectSchema = z.object({
  id: z.number().int().positive().describe('Subject ID'),
  name: z.string().optional().describe('Subject/company name'),
  street: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  zip: z.string().optional().describe('ZIP/postal code'),
  country: z.string().optional().describe('Country code (e.g., "CZ", "SK")'),
  registration_no: z.string().optional().describe('Company registration number (ICO)'),
  vat_no: z.string().optional().describe('VAT number (DIC, e.g., "CZ12345678")'),
  email: z.string().optional().describe('Contact email'),
  phone: z.string().optional().describe('Contact phone'),
  web: z.string().optional().describe('Website URL'),
  bank_account: z.string().optional().describe('Bank account number'),
  iban: z.string().optional().describe('IBAN'),
  note: z.string().optional().describe('Internal note'),
});

export const DeleteSubjectSchema = z.object({
  id: z.number().int().positive().describe('Subject ID'),
});

// ── Invoice Delete ────────────────────────────────────────────────

export const DeleteInvoiceSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
});

// ── Invoice Payments ──────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
  paid_on: z.string().optional().describe('Payment date (YYYY-MM-DD, default: today)'),
  amount: z.number().optional().describe('Payment amount (default: remaining amount)'),
  currency: z.string().optional().describe('Currency code (e.g., "CZK", "EUR")'),
  bank_account_id: z.number().int().positive().optional().describe('Bank account ID'),
});

export const DeletePaymentSchema = z.object({
  invoice_id: z.number().int().positive().describe('Invoice ID'),
  payment_id: z.number().int().positive().describe('Payment ID'),
});

// ── Invoice Messages ──────────────────────────────────────────────

export const SendInvoiceMessageSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
  email: z.string().describe('Recipient email address'),
  subject: z.string().optional().describe('Email subject'),
  message: z.string().optional().describe('Email message body'),
});

// ── Expenses ───────────────────────────────────────────────────────

export const ListExpensesSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter expenses updated since this date'),
  status: z.enum(['open', 'overdue', 'paid']).optional().describe('Filter by expense status'),
  subject_id: z.number().int().positive().optional().describe('Filter by subject/contact ID'),
});

export const CreateExpenseSchema = z.object({
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  number: z.string().optional().describe('Expense document number'),
  original_number: z.string().optional().describe('Original document number from supplier'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  taxable_fulfillment_due: z.string().optional().describe('Date of taxable fulfillment'),
  due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note'),
  lines: z
    .array(
      z.object({
        name: z.string().describe('Line item name'),
        quantity: z.number().optional().describe('Quantity'),
        unit_name: z.string().optional().describe('Unit name'),
        unit_price: z.number().describe('Unit price'),
        vat_rate: z.number().optional().describe('VAT rate percentage'),
      })
    )
    .min(1)
    .describe('Expense line items'),
  tags: z.array(z.string()).optional().describe('Tags'),
});

export const GetExpenseSchema = z.object({
  id: z.number().int().positive().describe('Expense ID'),
});

export const UpdateExpenseSchema = z.object({
  id: z.number().int().positive().describe('Expense ID'),
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  number: z.string().optional().describe('Expense document number'),
  original_number: z.string().optional().describe('Original document number from supplier'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  taxable_fulfillment_due: z.string().optional().describe('Date of taxable fulfillment'),
  due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note'),
  lines: z
    .array(
      z.object({
        name: z.string().describe('Line item name'),
        quantity: z.number().optional().describe('Quantity'),
        unit_name: z.string().optional().describe('Unit name'),
        unit_price: z.number().describe('Unit price'),
        vat_rate: z.number().optional().describe('VAT rate percentage'),
      })
    )
    .optional()
    .describe('Expense line items (replaces existing)'),
  tags: z.array(z.string()).optional().describe('Tags'),
});

export const SearchExpensesSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  page: z.number().int().positive().optional().describe('Page number'),
});

// ── Expense Payments ──────────────────────────────────────────────

export const CreateExpensePaymentSchema = z.object({
  id: z.number().int().positive().describe('Expense ID'),
  paid_on: z.string().optional().describe('Payment date (YYYY-MM-DD, default: today)'),
  amount: z.number().optional().describe('Payment amount'),
  currency: z.string().optional().describe('Currency code'),
});

export const DeleteExpensePaymentSchema = z.object({
  expense_id: z.number().int().positive().describe('Expense ID'),
  payment_id: z.number().int().positive().describe('Payment ID'),
});

// ── Users & Bank Accounts ─────────────────────────────────────────

// Uses EmptySchema (no params)

// ── Inventory Items ───────────────────────────────────────────────

export const ListInventoryItemsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
});

export const GetInventoryItemSchema = z.object({
  id: z.number().int().positive().describe('Inventory item ID'),
});

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1).describe('Item name'),
  sku: z.string().optional().describe('Stock keeping unit (SKU)'),
  article_number: z.string().optional().describe('Article/catalog number'),
  unit_name: z.string().optional().describe('Unit name (e.g., "ks", "pcs")'),
  buy_price: z.number().optional().describe('Buy/purchase price'),
  sell_price: z.number().optional().describe('Sell price'),
  vat_rate: z.number().optional().describe('VAT rate percentage'),
  supply: z.number().optional().describe('Current supply/stock quantity'),
});

export const UpdateInventoryItemSchema = z.object({
  id: z.number().int().positive().describe('Inventory item ID'),
  name: z.string().optional().describe('Item name'),
  sku: z.string().optional().describe('Stock keeping unit (SKU)'),
  article_number: z.string().optional().describe('Article/catalog number'),
  unit_name: z.string().optional().describe('Unit name'),
  buy_price: z.number().optional().describe('Buy/purchase price'),
  sell_price: z.number().optional().describe('Sell price'),
  vat_rate: z.number().optional().describe('VAT rate percentage'),
  supply: z.number().optional().describe('Current supply/stock quantity'),
});

export const SearchInventoryItemsSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  page: z.number().int().positive().optional().describe('Page number'),
});

// ── Inventory Moves ───────────────────────────────────────────────

export const ListInventoryMovesSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter moves since this date (ISO 8601)'),
  inventory_item_id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Filter by inventory item ID'),
});

export const CreateInventoryMoveSchema = z.object({
  inventory_item_id: z.number().int().positive().describe('Inventory item ID'),
  direction: z.enum(['in', 'out']).describe('Move direction: "in" (stock in) or "out" (stock out)'),
  quantity: z.number().positive().describe('Quantity to move'),
  price_per_unit: z.number().optional().describe('Price per unit'),
  moved_on: z.string().optional().describe('Date of move (YYYY-MM-DD, default: today)'),
});

// ── Generators (Invoice Templates) ────────────────────────────────

export const ListGeneratorsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter generators updated since this date'),
});

export const GetGeneratorSchema = z.object({
  id: z.number().int().positive().describe('Generator ID'),
});

export const CreateGeneratorSchema = z.object({
  name: z.string().min(1).describe('Generator/template name'),
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  lines: z
    .array(
      z.object({
        name: z.string().describe('Line item name/description'),
        quantity: z.number().optional().describe('Quantity (default: 1)'),
        unit_name: z.string().optional().describe('Unit name'),
        unit_price: z.number().describe('Unit price (without VAT)'),
        vat_rate: z.number().optional().describe('VAT rate percentage'),
      })
    )
    .optional()
    .describe('Template line items'),
});

// ── Recurring Generators ──────────────────────────────────────────

export const ListRecurringGeneratorsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
});

export const GetRecurringGeneratorSchema = z.object({
  id: z.number().int().positive().describe('Recurring generator ID'),
});

// ── Events (Audit Log) ───────────────────────────────────────────

export const ListEventsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter events since this date (ISO 8601)'),
  subject_id: z.number().int().positive().optional().describe('Filter by subject ID'),
});

// ── Todos ─────────────────────────────────────────────────────────

export const ListTodosSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter todos since this date (ISO 8601)'),
});

export const ToggleTodoSchema = z.object({
  id: z.number().int().positive().describe('Todo ID'),
});
