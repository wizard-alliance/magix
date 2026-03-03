-- Clear all stored LS web page URLs from pdf_url column.
-- These were HTML pages (https://app.lemonsqueezy.com/my-orders/...),
-- not actual PDF files. The column is now used for local cache paths.
-- PDFs will be generated via the LS generate-invoice API on first download.

UPDATE billing_invoices SET pdf_url = NULL WHERE pdf_url LIKE 'http%';
