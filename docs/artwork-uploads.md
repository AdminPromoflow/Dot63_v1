# Customer artwork PDFs

The customer product preview accepts one optional PDF in **Artwork templates**. The file is sent with Add to cart or Buy now; selecting it alone does not upload it. Continuing without a PDF requires confirmation. The selection survives the sign-in modal and its automatic retry.

`jobs.pdf_artwork_link` stores the relative path `controller/uploads/job-artworks/<job_id>/<random-name>.pdf`, or SQL `NULL` when no artwork is supplied. Supplier templates remain in `variations.pdf_artwork`. The existing jobs schema already includes the nullable TEXT column; no migration is needed.

The web server's PHP user needs write permission on `controller/uploads/job-artworks/`. Job subdirectories are created automatically. Back up this directory along with the database; generated PDFs are intentionally ignored by Git. Recommended PHP limits are `upload_max_filesize` of at least `8M` and `post_max_size` greater than `8M` (for example `10M`). Smaller hosting limits produce an upload error.

The server requires the customer session and CSRF token, checks the upload, extension, MIME type and 8 MB limit, and generates the filename itself. A failed job transaction removes the newly uploaded PDF. Existing jobs are not rewritten.

Local verification: `php tests/artwork_upload_integration.php` uses a temporary MySQL database cloned from the local `dot63` schema, removes its test PDFs and drops only that test database. `node tests/artwork_upload_ui.cjs` checks the browser flow with mocked product/cart responses.
