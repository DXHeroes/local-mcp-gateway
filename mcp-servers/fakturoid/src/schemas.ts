/**
 * Zod input schemas for all Fakturoid MCP tools
 */

import { z } from 'zod';

// ── Account ────────────────────────────────────────────────────────

export const EmptySchema = z.object({});

// ── Invoices ───────────────────────────────────────────────────────

export const ListInvoicesSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter invoices created since this date (ISO 8601)'),
  until: z.string().optional().describe('Filter invoices created before this date (ISO 8601)'),
  updated_since: z.string().optional().describe('Filter invoices updated since this datetime'),
  updated_until: z.string().optional().describe('Filter invoices updated before this datetime'),
  number: z.string().optional().describe('Filter by invoice number'),
  status: z
    .enum(['open', 'sent', 'overdue', 'paid', 'cancelled', 'uncollectible'])
    .optional()
    .describe('Filter by invoice status'),
  subject_id: z.number().int().positive().optional().describe('Filter by subject/contact ID'),
  custom_id: z.string().optional().describe('Filter by custom ID'),
  document_type: z
    .enum(['regular', 'proforma', 'correction', 'tax_document'])
    .optional()
    .describe('Filter by document type'),
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
  inventory_item_id: z.number().int().positive().optional().describe('Link to inventory item'),
  sku: z.string().optional().describe('Stock keeping unit'),
});

export const CreateInvoiceSchema = z.object({
  subject_id: z.number().int().positive().describe('Subject/contact ID for the invoice'),
  custom_id: z.string().optional().describe('Custom identifier'),
  document_type: z
    .enum([
      'invoice',
      'proforma',
      'partial_proforma',
      'correction',
      'tax_document',
      'final_invoice',
    ])
    .optional()
    .describe('Document type'),
  number: z.string().optional().describe('Document number (auto-generated if omitted)'),
  variable_symbol: z.string().optional().describe('Variable symbol (auto-calculated if omitted)'),
  order_number: z.string().optional().describe('Order number'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card', 'custom'])
    .optional()
    .describe('Payment method'),
  custom_payment_method: z
    .string()
    .optional()
    .describe('Custom payment method name (max 20 chars)'),
  currency: z.string().optional().describe('Currency code (e.g., "CZK", "EUR", "USD")'),
  exchange_rate: z
    .number()
    .optional()
    .describe('Exchange rate (required if currency differs from account)'),
  language: z
    .enum(['cz', 'sk', 'en', 'de', 'fr', 'it', 'es', 'ru', 'pl', 'hu', 'ro'])
    .optional()
    .describe('Invoice language'),
  due: z.number().int().optional().describe('Due in days (default: 14)'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD, default: today)'),
  taxable_fulfillment_due: z
    .string()
    .optional()
    .describe('Date of taxable fulfillment (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note displayed on the invoice (before lines)'),
  footer_note: z.string().optional().describe('Footer note on the invoice'),
  private_note: z.string().optional().describe('Private note (not visible to client)'),
  bank_account_id: z.number().int().positive().optional().describe('Bank account ID to display'),
  vat_price_mode: z
    .enum(['without_vat', 'from_total_with_vat'])
    .optional()
    .describe('VAT price calculation mode'),
  round_total: z.boolean().optional().describe('Round total amount'),
  transferred_tax_liability: z
    .boolean()
    .optional()
    .describe('Reverse charge (transferred tax liability)'),
  supply_code: z.string().optional().describe('Supply code for reverse charge'),
  oss: z.enum(['disabled', 'service', 'goods']).optional().describe('One Stop Shop (OSS) mode'),
  lines: z.array(InvoiceLineSchema).min(1).describe('Invoice line items'),
  tags: z.array(z.string()).optional().describe('Tags for the invoice'),
});

export const UpdateInvoiceSchema = z.object({
  id: z.number().int().positive().describe('Invoice ID'),
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  custom_id: z.string().optional().describe('Custom identifier'),
  document_type: z
    .enum([
      'invoice',
      'proforma',
      'partial_proforma',
      'correction',
      'tax_document',
      'final_invoice',
    ])
    .optional()
    .describe('Document type'),
  variable_symbol: z.string().optional().describe('Variable symbol'),
  order_number: z.string().optional().describe('Order number'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card', 'custom'])
    .optional()
    .describe('Payment method'),
  custom_payment_method: z
    .string()
    .optional()
    .describe('Custom payment method name (max 20 chars)'),
  currency: z.string().optional().describe('Currency code'),
  exchange_rate: z.number().optional().describe('Exchange rate'),
  language: z
    .enum(['cz', 'sk', 'en', 'de', 'fr', 'it', 'es', 'ru', 'pl', 'hu', 'ro'])
    .optional()
    .describe('Invoice language'),
  due: z.number().int().optional().describe('Due in days'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  taxable_fulfillment_due: z
    .string()
    .optional()
    .describe('Date of taxable fulfillment (YYYY-MM-DD)'),
  note: z.string().optional().describe('Note displayed on the invoice'),
  footer_note: z.string().optional().describe('Footer note on the invoice'),
  private_note: z.string().optional().describe('Private note (not visible to client)'),
  bank_account_id: z.number().int().positive().optional().describe('Bank account ID'),
  vat_price_mode: z
    .enum(['without_vat', 'from_total_with_vat'])
    .optional()
    .describe('VAT price calculation mode'),
  round_total: z.boolean().optional().describe('Round total amount'),
  transferred_tax_liability: z.boolean().optional().describe('Reverse charge'),
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
      'mark_as_uncollectible',
      'undo_uncollectible',
    ])
    .describe('Invoice event/action to fire'),
  paid_on: z.string().optional().describe('Payment date for pay event (YYYY-MM-DD)'),
  paid_amount: z.number().optional().describe('Partial payment amount (for pay_partial_proforma)'),
});

export const SearchInvoicesSchema = z.object({
  query: z.string().min(1).describe('Search query (searches invoice number, subject name, etc.)'),
  page: z.number().int().positive().optional().describe('Page number'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
});

// ── Subjects (Contacts) ───────────────────────────────────────────

export const ListSubjectsSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number (starts at 1)'),
  since: z.string().optional().describe('Filter subjects created since this date'),
  updated_since: z.string().optional().describe('Filter subjects updated since this datetime'),
  custom_id: z.string().optional().describe('Filter by custom ID'),
});

export const GetSubjectSchema = z.object({
  id: z.number().int().positive().describe('Subject ID'),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(1).describe('Subject/company name'),
  custom_id: z.string().optional().describe('Custom identifier'),
  type: z.enum(['customer', 'supplier', 'both']).optional().describe('Subject type'),
  full_name: z.string().optional().describe('Full legal name'),
  street: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  zip: z.string().optional().describe('ZIP/postal code'),
  country: z.string().optional().describe('Country code (e.g., "CZ", "SK")'),
  registration_no: z.string().optional().describe('Company registration number (ICO)'),
  vat_no: z.string().optional().describe('VAT number (DIC, e.g., "CZ12345678")'),
  local_vat_no: z.string().optional().describe('Local VAT number'),
  email: z.string().optional().describe('Contact email'),
  email_copy: z.string().optional().describe('Email copy address'),
  phone: z.string().optional().describe('Contact phone'),
  web: z.string().optional().describe('Website URL'),
  bank_account: z.string().optional().describe('Bank account number'),
  iban: z.string().optional().describe('IBAN'),
  swift_bic: z.string().optional().describe('SWIFT/BIC code'),
  variable_symbol: z.string().optional().describe('Default variable symbol'),
  due: z.number().int().optional().describe('Default due days'),
  currency: z.string().optional().describe('Default currency code'),
  language: z.string().optional().describe('Default language (e.g., "cz", "en")'),
  private_note: z.string().optional().describe('Private note (internal only)'),
  note: z.string().optional().describe('Internal note'),
  has_delivery_address: z.boolean().optional().describe('Has separate delivery address'),
  delivery_name: z.string().optional().describe('Delivery name'),
  delivery_street: z.string().optional().describe('Delivery street'),
  delivery_city: z.string().optional().describe('Delivery city'),
  delivery_zip: z.string().optional().describe('Delivery ZIP code'),
  delivery_country: z.string().optional().describe('Delivery country code'),
});

export const SearchSubjectsSchema = z.object({
  query: z.string().min(1).describe('Search query (searches name, registration_no, etc.)'),
  page: z.number().int().positive().optional().describe('Page number'),
});

export const UpdateSubjectSchema = z.object({
  id: z.number().int().positive().describe('Subject ID'),
  name: z.string().optional().describe('Subject/company name'),
  custom_id: z.string().optional().describe('Custom identifier'),
  type: z.enum(['customer', 'supplier', 'both']).optional().describe('Subject type'),
  full_name: z.string().optional().describe('Full legal name'),
  street: z.string().optional().describe('Street address'),
  city: z.string().optional().describe('City'),
  zip: z.string().optional().describe('ZIP/postal code'),
  country: z.string().optional().describe('Country code (e.g., "CZ", "SK")'),
  registration_no: z.string().optional().describe('Company registration number (ICO)'),
  vat_no: z.string().optional().describe('VAT number (DIC, e.g., "CZ12345678")'),
  local_vat_no: z.string().optional().describe('Local VAT number'),
  email: z.string().optional().describe('Contact email'),
  email_copy: z.string().optional().describe('Email copy address'),
  phone: z.string().optional().describe('Contact phone'),
  web: z.string().optional().describe('Website URL'),
  bank_account: z.string().optional().describe('Bank account number'),
  iban: z.string().optional().describe('IBAN'),
  swift_bic: z.string().optional().describe('SWIFT/BIC code'),
  variable_symbol: z.string().optional().describe('Default variable symbol'),
  due: z.number().int().optional().describe('Default due days'),
  currency: z.string().optional().describe('Default currency code'),
  language: z.string().optional().describe('Default language'),
  private_note: z.string().optional().describe('Private note (internal only)'),
  note: z.string().optional().describe('Internal note'),
  has_delivery_address: z.boolean().optional().describe('Has separate delivery address'),
  delivery_name: z.string().optional().describe('Delivery name'),
  delivery_street: z.string().optional().describe('Delivery street'),
  delivery_city: z.string().optional().describe('Delivery city'),
  delivery_zip: z.string().optional().describe('Delivery ZIP code'),
  delivery_country: z.string().optional().describe('Delivery country code'),
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
  native_amount: z.number().optional().describe('Payment amount in account currency'),
  currency: z.string().optional().describe('Currency code (e.g., "CZK", "EUR")'),
  bank_account_id: z.number().int().positive().optional().describe('Bank account ID'),
  mark_document_as_paid: z
    .boolean()
    .optional()
    .describe('Mark document as paid (default: true if total paid >= remaining)'),
  variable_symbol: z.string().optional().describe('Payment variable symbol'),
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
  since: z.string().optional().describe('Filter expenses created since this date'),
  updated_since: z.string().optional().describe('Filter expenses updated since this datetime'),
  status: z.enum(['open', 'overdue', 'paid']).optional().describe('Filter by expense status'),
  subject_id: z.number().int().positive().optional().describe('Filter by subject/contact ID'),
  number: z.string().optional().describe('Filter by expense number'),
  variable_symbol: z.string().optional().describe('Filter by variable symbol'),
  custom_id: z.string().optional().describe('Filter by custom ID'),
});

export const CreateExpenseSchema = z.object({
  subject_id: z.number().int().positive().optional().describe('Subject/contact ID'),
  custom_id: z.string().optional().describe('Custom identifier'),
  number: z.string().optional().describe('Expense document number'),
  original_number: z.string().optional().describe('Original document number from supplier'),
  variable_symbol: z.string().optional().describe('Variable symbol'),
  document_type: z.enum(['invoice', 'bill', 'other']).optional().describe('Expense document type'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code'),
  exchange_rate: z.number().optional().describe('Exchange rate'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  received_on: z.string().optional().describe('Received date (YYYY-MM-DD)'),
  taxable_fulfillment_due: z.string().optional().describe('Date of taxable fulfillment'),
  due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  description: z.string().optional().describe('Expense description'),
  note: z.string().optional().describe('Note'),
  private_note: z.string().optional().describe('Private note (internal only)'),
  vat_price_mode: z
    .enum(['without_vat', 'from_total_with_vat'])
    .optional()
    .describe('VAT price calculation mode'),
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
  custom_id: z.string().optional().describe('Custom identifier'),
  number: z.string().optional().describe('Expense document number'),
  original_number: z.string().optional().describe('Original document number from supplier'),
  variable_symbol: z.string().optional().describe('Variable symbol'),
  document_type: z.enum(['invoice', 'bill', 'other']).optional().describe('Expense document type'),
  payment_method: z
    .enum(['bank', 'cash', 'cod', 'paypal', 'card'])
    .optional()
    .describe('Payment method'),
  currency: z.string().optional().describe('Currency code'),
  exchange_rate: z.number().optional().describe('Exchange rate'),
  issued_on: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  received_on: z.string().optional().describe('Received date (YYYY-MM-DD)'),
  taxable_fulfillment_due: z.string().optional().describe('Date of taxable fulfillment'),
  due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  description: z.string().optional().describe('Expense description'),
  note: z.string().optional().describe('Note'),
  private_note: z.string().optional().describe('Private note (internal only)'),
  vat_price_mode: z
    .enum(['without_vat', 'from_total_with_vat'])
    .optional()
    .describe('VAT price calculation mode'),
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
  tags: z.array(z.string()).optional().describe('Filter by tags'),
});

export const DeleteExpenseSchema = z.object({
  id: z.number().int().positive().describe('Expense ID'),
});

export const ExpenseActionSchema = z.object({
  id: z.number().int().positive().describe('Expense ID'),
  event: z.enum(['lock', 'unlock']).describe('Expense event/action to fire'),
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
  inventory_item_id: z.number().int().positive().optional().describe('Filter by inventory item ID'),
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
