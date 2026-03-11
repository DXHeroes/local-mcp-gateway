/**
 * Zod input schemas for all Abra Flexi MCP tools
 */

import { z } from 'zod';

// ── Account ────────────────────────────────────────────────────────

export const EmptySchema = z.object({});

// ── Shared Pagination/Filter ───────────────────────────────────────

const PaginationParams = {
  limit: z.number().int().positive().max(500).optional().describe('Max records to return (max 500)'),
  start: z.number().int().min(0).optional().describe('Offset for pagination (starts at 0)'),
  order: z.string().optional().describe('Sort order (e.g., "datVyst desc", "kod asc")'),
  filter: z
    .string()
    .optional()
    .describe(
      'Flexi filter expression (e.g., "datVyst >= \'2024-01-01\'" or "stav = \'stavDo  kl.dokonceno\'")'
    ),
};

// ── Issued Invoices (faktura-vydana) ───────────────────────────────

export const ListIssuedInvoicesSchema = z.object({
  ...PaginationParams,
});

export const GetIssuedInvoiceSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Invoice ID or code'),
});

export const CreateIssuedInvoiceSchema = z.object({
  typDokl: z.string().optional().describe('Document type code (e.g., "code:FAKTURA")'),
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Contact ID or code (e.g., "code:FIRMA123")'),
  datVyst: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  datSplat: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  datUcto: z.string().optional().describe('Accounting date (YYYY-MM-DD)'),
  mena: z.string().optional().describe('Currency code (e.g., "code:CZK", "code:EUR")'),
  popis: z.string().optional().describe('Description / note'),
  poznam: z.string().optional().describe('Internal note'),
  polozkyFaktury: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity (default: 1)'),
        cenaMj: z.number().describe('Unit price (without VAT)'),
        typSzbDphK: z.string().optional().describe('VAT rate type (e.g., "typSzbDph.  662u21")'),
        szbDph: z.number().optional().describe('VAT rate percentage (e.g., 21)'),
      })
    )
    .optional()
    .describe('Invoice line items'),
});

// ── Received Invoices (faktura-prijata) ────────────────────────────

export const ListReceivedInvoicesSchema = z.object({
  ...PaginationParams,
});

export const CreateReceivedInvoiceSchema = z.object({
  typDokl: z.string().optional().describe('Document type code'),
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Supplier contact ID or code'),
  datVyst: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  datSplat: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  datUcto: z.string().optional().describe('Accounting date (YYYY-MM-DD)'),
  mena: z.string().optional().describe('Currency code'),
  popis: z.string().optional().describe('Description'),
  cisObj: z.string().optional().describe('Supplier invoice number'),
  polozkyFaktury: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity'),
        cenaMj: z.number().describe('Unit price'),
        szbDph: z.number().optional().describe('VAT rate percentage'),
      })
    )
    .optional()
    .describe('Invoice line items'),
});

// ── Contacts (adresar) ─────────────────────────────────────────────

export const ListContactsSchema = z.object({
  ...PaginationParams,
});

export const GetContactSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Contact ID or code'),
});

export const CreateContactSchema = z.object({
  nazev: z.string().min(1).describe('Company/contact name'),
  ulice: z.string().optional().describe('Street address'),
  mesto: z.string().optional().describe('City'),
  psc: z.string().optional().describe('ZIP/postal code'),
  stat: z.string().optional().describe('Country code (e.g., "code:CZ")'),
  ic: z.string().optional().describe('Company registration number (ICO)'),
  dic: z.string().optional().describe('VAT number (DIC)'),
  email: z.string().optional().describe('Email'),
  tel: z.string().optional().describe('Phone number'),
  www: z.string().optional().describe('Website URL'),
  fpiPriority: z.number().optional().describe('Priority (ordering)'),
  poznam: z.string().optional().describe('Internal note'),
});

// ── Bank Statements (banka) ────────────────────────────────────────

export const ListBankStatementsSchema = z.object({
  ...PaginationParams,
});

// ── Products (cenik) ───────────────────────────────────────────────

export const ListProductsSchema = z.object({
  ...PaginationParams,
});

export const CreateProductSchema = z.object({
  kod: z.string().min(1).describe('Product code (unique identifier)'),
  nazev: z.string().min(1).describe('Product name'),
  cenaBezDph: z.number().optional().describe('Price without VAT'),
  cenaSdph: z.number().optional().describe('Price with VAT'),
  szbDph: z.number().optional().describe('VAT rate percentage'),
  mpiT: z.string().optional().describe('Unit (e.g., "ks", "hod")'),
  ppiopis: z.string().optional().describe('Description'),
  poznam: z.string().optional().describe('Internal note'),
});

// ── Update Issued Invoice (faktura-vydana) ───────────────────────

export const UpdateIssuedInvoiceSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Invoice ID or code'),
  typDokl: z.string().optional().describe('Document type code (e.g., "code:FAKTURA")'),
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .optional()
    .describe('Contact ID or code (e.g., "code:FIRMA123")'),
  datVyst: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  datSplat: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  datUcto: z.string().optional().describe('Accounting date (YYYY-MM-DD)'),
  mena: z.string().optional().describe('Currency code (e.g., "code:CZK", "code:EUR")'),
  popis: z.string().optional().describe('Description / note'),
  poznam: z.string().optional().describe('Internal note'),
  polozkyFaktury: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity (default: 1)'),
        cenaMj: z.number().describe('Unit price (without VAT)'),
        typSzbDphK: z.string().optional().describe('VAT rate type (e.g., "typSzbDph.662u21")'),
        szbDph: z.number().optional().describe('VAT rate percentage (e.g., 21)'),
      })
    )
    .optional()
    .describe('Invoice line items'),
});

// ── Get / Update Received Invoice (faktura-prijata) ──────────────

export const GetReceivedInvoiceSchema = z.object({
  id: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Received invoice ID or code'),
});

export const UpdateReceivedInvoiceSchema = z.object({
  id: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Received invoice ID or code'),
  typDokl: z.string().optional().describe('Document type code'),
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .optional()
    .describe('Supplier contact ID or code'),
  datVyst: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  datSplat: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  datUcto: z.string().optional().describe('Accounting date (YYYY-MM-DD)'),
  mena: z.string().optional().describe('Currency code'),
  popis: z.string().optional().describe('Description'),
  cisObj: z.string().optional().describe('Supplier invoice number'),
  polozkyFaktury: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity'),
        cenaMj: z.number().describe('Unit price'),
        szbDph: z.number().optional().describe('VAT rate percentage'),
      })
    )
    .optional()
    .describe('Invoice line items'),
});

// ── Update Contact (adresar) ────────────────────────────────────

export const UpdateContactSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Contact ID or code'),
  nazev: z.string().min(1).optional().describe('Company/contact name'),
  ulice: z.string().optional().describe('Street address'),
  mesto: z.string().optional().describe('City'),
  psc: z.string().optional().describe('ZIP/postal code'),
  stat: z.string().optional().describe('Country code (e.g., "code:CZ")'),
  ic: z.string().optional().describe('Company registration number (ICO)'),
  dic: z.string().optional().describe('VAT number (DIC)'),
  email: z.string().optional().describe('Email'),
  tel: z.string().optional().describe('Phone number'),
  www: z.string().optional().describe('Website URL'),
  fpiPriority: z.number().optional().describe('Priority (ordering)'),
  poznam: z.string().optional().describe('Internal note'),
});

// ── Update Product (cenik) ──────────────────────────────────────

export const UpdateProductSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Product ID or code'),
  kod: z.string().min(1).optional().describe('Product code (unique identifier)'),
  nazev: z.string().min(1).optional().describe('Product name'),
  cenaBezDph: z.number().optional().describe('Price without VAT'),
  cenaSdph: z.number().optional().describe('Price with VAT'),
  szbDph: z.number().optional().describe('VAT rate percentage'),
  mpiT: z.string().optional().describe('Unit (e.g., "ks", "hod")'),
  ppiopis: z.string().optional().describe('Description'),
  poznam: z.string().optional().describe('Internal note'),
});

// ── Orders Received (objednavka-prijata) ─────────────────────────

export const ListOrdersReceivedSchema = z.object({
  ...PaginationParams,
});

export const CreateOrderReceivedSchema = z.object({
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Contact ID or code'),
  datObj: z.string().optional().describe('Order date (YYYY-MM-DD)'),
  popis: z.string().optional().describe('Description'),
  polozkyObjednavky: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity'),
        cenaMj: z.number().optional().describe('Unit price'),
      })
    )
    .optional()
    .describe('Order line items'),
});

// ── Orders Issued (objednavka-vydana) ────────────────────────────

export const ListOrdersIssuedSchema = z.object({
  ...PaginationParams,
});

export const CreateOrderIssuedSchema = z.object({
  firma: z
    .union([z.number().int().positive(), z.string().min(1)])
    .describe('Contact ID or code'),
  datObj: z.string().optional().describe('Order date (YYYY-MM-DD)'),
  popis: z.string().optional().describe('Description'),
  polozkyObjednavky: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        mnozMj: z.number().optional().describe('Quantity'),
        cenaMj: z.number().optional().describe('Unit price'),
      })
    )
    .optional()
    .describe('Order line items'),
});

// ── Cash Movements (pokladni-pohyb) ─────────────────────────────

export const ListCashMovementsSchema = z.object({
  ...PaginationParams,
});

// ── Internal Documents (interni-doklad) ──────────────────────────

export const ListInternalDocumentsSchema = z.object({
  ...PaginationParams,
});

export const CreateInternalDocumentSchema = z.object({
  typDokl: z.string().optional().describe('Document type code'),
  datVyst: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
  popis: z.string().optional().describe('Description'),
  sumCelkem: z.number().optional().describe('Total amount'),
  polozkyIntDokl: z
    .array(
      z.object({
        nazev: z.string().describe('Line item name'),
        castka: z.number().optional().describe('Amount'),
        ucet: z.string().optional().describe('Account code'),
      })
    )
    .optional()
    .describe('Internal document line items'),
});

// ── Stock Movements (skladovy-pohyb) ─────────────────────────────

export const ListStockMovementsSchema = z.object({
  ...PaginationParams,
});

// ── Generic Records ────────────────────────────────────────────────

export const ListRecordsSchema = z.object({
  evidence: z
    .string()
    .min(1)
    .describe(
      'Evidence (endpoint) name, e.g., "faktura-vydana", "adresar", "banka", "cenik", "objednavka-prijata", "pokladna"'
    ),
  ...PaginationParams,
  detail: z
    .enum(['id', 'summary', 'full', 'custom'])
    .optional()
    .describe('Detail level: id (IDs only), summary (key fields), full (all fields)'),
});

export const GetRecordSchema = z.object({
  evidence: z.string().min(1).describe('Evidence (endpoint) name'),
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Record ID or code'),
});

export const CreateRecordSchema = z.object({
  evidence: z.string().min(1).describe('Evidence (endpoint) name'),
  data: z.record(z.string(), z.unknown()).describe('Record data as key-value pairs'),
});

export const UpdateRecordSchema = z.object({
  evidence: z.string().min(1).describe('Evidence (endpoint) name'),
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Record ID or code'),
  data: z.record(z.string(), z.unknown()).describe('Fields to update as key-value pairs'),
});

export const DeleteRecordSchema = z.object({
  evidence: z.string().min(1).describe('Evidence (endpoint) name'),
  id: z.union([z.number().int().positive(), z.string().min(1)]).describe('Record ID or code'),
});
