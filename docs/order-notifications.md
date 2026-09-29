# Paid-order emails

After the Stripe webhook confirms a paid order, Ian and the customer associated with `orders.customer_id` each receive all its jobs, including the artwork download links. Each supplier receives only their jobs. The customer copy is addressed to the customer's account email and uses the subject **Your order #...**. The customer payment confirmation remains a separate email. Existing delivery markers prevent already-sent notices from being sent again; matching customer, supplier and Ian email addresses receive just one order-details email per order. Orders without a valid customer email still notify Ian and their suppliers.

Each order email includes the job ID, order reference, product and SKU, status, creation date, notes, quantity, unit price and subtotal. The legacy `id_order` and `discount_percentage` appear when recorded. Selected `job_details` include variation ID, name, SKU, stored price, quantity and an image link when available. Stored option names are preferred over current catalog names.

`jobs.pdf_artwork_link` appears as a **Download artwork PDF** button and a copyable URL in HTML, and as a full URL in plain text. A missing PDF is marked **Not supplied**. The customer artwork file is used; supplier artwork templates are not substituted.

Relative file paths are resolved against `DOT63_PUBLIC_URL`, defaulting to `https://lanyardsforyou.com`. Set this environment variable to the public installation URL, including its subdirectory if needed (for example, `https://example.com/dot63`). Existing absolute HTTP(S) links are preserved. The webhook's incoming Host header is never used to construct email links.

Publish the uploaded files along with the application. `controller/uploads/job-artworks/.htaccess` serves uploaded PDFs as attachments on Apache with `mod_headers`; other web servers must configure the equivalent `Content-Type: application/pdf` and `Content-Disposition: attachment` headers. Emails contain links, not binary PDF attachments.

Verification: `php tests/email_notifications.php` captures messages without sending SMTP mail. `php tests/order_notifications_integration.php` uses the configured database, creates isolated test records and cleans them up; run it against a test database. It checks paid status, complete job data, supplier isolation, missing artwork and duplicate/retry behavior.
