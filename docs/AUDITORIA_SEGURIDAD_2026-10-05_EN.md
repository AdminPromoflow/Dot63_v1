# Dot63 security report — English

Date: **5 October 2026**. Reviewed code: local Dot63 copy, commit `f18c867`; working tree clean at the start. Relevant integration code in the local Promoflow copy was also inspected. No application code, configuration or deployed website was changed.

## Executive summary

**Dot63 already has real security measures:** it protects passwords, requires authentication to change products and profiles, checks ownership, validates uploaded files and verifies Stripe confirmations. Current tests confirmed that many of these safeguards work.

**Important gaps remain.** The most urgent concerns the relationship between the cart and payment: in a simulated test, a £19.50 payment was prepared for two units, the quantity was then increased to twenty, and the system marked those twenty units as ordered against the original payment. Older endpoints also exposed an unpublished product, and supplier registration accepted a one-character password. Customer documents are served through links that do not require sign-in.

The Promoflow messaging receiver also lacks access checks in the inspected code. Its internet exposure depends on the deployed version and any server restrictions. These findings do not demonstrate that a breach or actual data loss has occurred.

The user confirms that Dot63 is live. **This audit covers the available code and local tests; it does not establish that this copy matches the deployed website.** Locally verified protections and defects therefore cannot automatically be attributed to the public server.

## Existing protections verified

| Area | Protection already implemented | Evidence and limits |
| --- | --- | --- |
| Passwords | Customer and supplier passwords use `password_hash` and `password_verify`, rather than readable storage. Customer hashes are refreshed when needed. | [Customers][customer-hash], [suppliers][supplier-hash]. Customer registration checks format, length and complexity; supplier registration does not enforce equivalent checks. |
| Sessions | Session identifiers change at sign-in and logout. Cookies use HttpOnly and SameSite=Lax; strict mode is enabled; Secure is set when PHP detects HTTPS. Customer and supplier identities use separate session flags. | [Shared configuration][sessions], [customer login][customer-login], [supplier login][supplier-login]. HttpOnly/SameSite were observed on local Apache. Production HTTPS was not checked. |
| Catalogue and profiles | Editing requires supplier authentication, product ownership and consistent product, variation, price and item references. The profile being edited is selected from the session, not an email submitted by the browser. | [Access checks][permissions], [profile][profile]. The security suite passed 85 checks; it does not cover every legacy read endpoint. |
| Browser-initiated changes | Protected modifications require POST and a random session token, compared securely. The browser does not forward that token to other sites. | [Server][csrf], [browser][csrf-browser], [cart][cart-controller]. CSRF protection was tested for covered flows; it is not a universal barrier on every project endpoint. |
| Uploaded files | Extension, actual file type, an 8 MB size limit and image dimensions are checked; filenames are randomized. Apache blocks executable formats and PDFs are delivered as downloads. | [Validation][uploads], [directory rules][upload-rules]. Image tests and 44 PDF checks passed. No antivirus scanning was identified; MIME validation does not establish that a PDF is harmless. |
| Displayed data and database queries | Reviewed paths use parameterized queries and safe text rendering. Category, group and item tests verified that test content remains text. | [Frontend checks][frontend-test], [account queries][customer-hash]. No SQL injection or new script execution was confirmed in current views; this does not exclude them throughout the system. |
| Orders and Stripe | Cart prices are calculated on the server; address/order ownership is checked; webhook signatures, amount and currency are verified; transactions and duplicate-event handling are implemented. | [Pricing][cart-pricing], [address/order][order-prepare], [ownership][order-owner], [signature][webhook], [events][payment-replay]. H01 describes an important exception involving cart consistency. |
| Approvals and notifications | Status changes require review and version checks that reject stale approvals. The approval API requires an internal session and CSRF for modifications. Order notifications are prepared only after payment is recorded and separate jobs by recipient. | [Review workflow][status-review], [API][promo-approval], [proxy][promo-proxy], [notifications][notifications]. Notification tests used simulated delivery; a stale test prevented full approval-flow validation. |
| Internal files and configuration | Apache blocks Git, configuration, test files and upload directory listings. Security headers reduce unsafe file interpretation and embedding in other sites. Database and Stripe settings support private configuration; SMTP requires a configured password. | [HTTP rules][http-rules], [database][db-config], [Stripe][stripe-config], [SMTP][smtp-config]. The four tested local internal paths returned 403. CSP is basic and does not restrict all scripts. |

## Findings and priorities

Priorities indicate attention order and potential impact, not a numerical rating or certification. “Locally confirmed” means reproduced with synthetic data. “Confirmed in code” means the affected path was traced without executing it against real data.

### H01 — Quantities remain editable after payment preparation

**High priority. Locally confirmed in server-side logic.**

The order stores a total and links the cart jobs, but those jobs remain in `cart` status. `updateCartItem` can change their quantity and subtotal. When confirmation arrives, the received amount is compared with the order total, and linked jobs are marked `ordered` without checking that their original quantities and amounts are unchanged.

**Reproduced result:** simulated payment £19.50; change from 2 to 20 units accepted; job subtotal £195.00; order `paid` and job `ordered`. The test used the real models, a simulated Stripe client and a disposable database. There was no charge, Stripe API call or forgery of a valid signature. An additional ownership check correctly rejected another customer's order with 404.

**Impact:** an order can contain goods worth more than the amount paid if the deployed flow has this logic. **Recommendation:** freeze an immutable copy of order lines when preparing payment, or invalidate and recalculate the payment intent when the cart changes; check those lines again when confirming payment.

Evidence: [job linkage][order-link], [cart editing][cart-update], [payment confirmation][payment-confirm].

### H02 — Promoflow messaging receiver lacks authorization

**High priority. Confirmed in integration code; public exposure not verified.**

Dot63 requires a supplier session before forwarding requests, but the receiver in the local Promoflow copy dispatches actions without checking a session or integration credential. Its model lists all cases and retrieves messages using the submitted case identifier, without ownership checks. Message insertion also accepts the sender identity supplied in the request.

**Impact:** if that receiver is deployed and reachable, it would allow unauthorized conversation access or message insertion. Protection of the approval API does not automatically protect this separate receiver. **Recommendation:** authenticate service-to-service requests and enforce case ownership on every read and write, deriving identity from a validated source.

Evidence: [Dot63 sender][promo-sender], [Promoflow receiver][promo-receiver], [case/message queries][promo-messages], [message insertion][promo-message-write]. No messages were sent and no real conversations were queried.

### H03 — Legacy endpoints expose draft products

**Medium priority. Locally confirmed over HTTP without sign-in.**

The modern `get_customer_preview` action rejected a synthetic draft with 404, while `get_preview_product_details` returned its details with 200. `get_variation_children_by_id` also returned draft information, including the test price. Legacy queries do not apply the publication filter or authorization used by the modern endpoints.

**Impact:** unpublished commercial information is exposed to anyone who knows the identifiers. **Recommendation:** retire the legacy actions or apply the same publication and ownership controls.

Evidence: [legacy dispatch][legacy-dispatch], [SKU query without publication filtering][legacy-product], [variation queries][legacy-variations].

### H04 — Customer PDFs are accessible to anyone holding the link

**Medium priority; higher if documents are confidential. Confirmed on local Apache.**

PDFs are stored under the public web directory. An anonymous HEAD request to a synthetic document created for this audit returned 200. The rules force download but do not validate the owner. Emails contain direct download links.

Random filenames make URLs difficult to guess; they do not prevent access through a shared or leaked link. No real customer's document was downloaded, and this report does not claim that all files can be enumerated.

**Recommendation:** if these files should be private, deliver them through permission-checked downloads or expiring signed links, with storage outside the public directory.

Evidence: [storage][upload-store], [PDF rules][pdf-rules], [email links][pdf-email].

### H05 — Supplier registration accepts very weak passwords

**Medium priority. Locally confirmed.**

A direct registration request created a synthetic supplier account with a one-character password; its stored hash was verified against that password. Supplier registration does not enforce the policy used for customers. No attempt limiting was found in either reviewed login controller. External hosting-level limits were not verified.

**Impact:** weak accounts and automated password guessing become easier. **Recommendation:** enforce supplier registration validation on the server and limit attempts by account and source; consider a second factor for accounts allowed to review products.

Evidence: [registration][supplier-register], [supplier model][supplier-hash], [customer validation][customer-validation], [customer login][customer-login], [supplier login][supplier-login].

### H06 — Previously exposed credentials: replacement unconfirmed

**High operational verification priority. The continued validity of old credentials was not established.**

The earlier report documented database and email credentials embedded in code and awaiting replacement. Current configuration avoids those default passwords, and local secret files are excluded from Git. A limited pattern search of current code found no matching literal credentials. This does not prove that old credentials were revoked or that Git history contains no secrets.

**Recommendation:** confirm revocation and replacement with the service providers, and review access records and privileges. No attempt was made to authenticate with old credentials or display their values.

Evidence: [documented history][prior], [current database configuration][db-config], [current SMTP configuration][smtp-config].

### H07 — Local server still runs unsupported PHP

**High priority for the affected environment. Locally confirmed; production version unknown.**

Local Apache reported PHP 8.0.28 during this review. Official support for PHP 8.0 ended on 26 November 2023. No specific runtime exploit was demonstrated. **Recommendation:** update and test a supported branch, and independently verify the live server's version. [Official PHP lifecycle table](https://www.php.net/eol.php).

### H08 — Password recovery is incomplete

**Medium priority for account management. Confirmed in code; no account takeover demonstrated.**

The recovery screen provides an email input, but its JavaScript reads a missing password input and submits a login action that the supplier controller does not support. No recovery flow using a single-use, expiring token was found in the reviewed controllers.

**Impact:** users who lose their passwords may lack a working recovery path and depend on manual procedures. **Recommendation:** implement and test email recovery with generic responses, expiring single-use tokens and attempt limits.

Evidence: [screen][recovery-view], [JavaScript][recovery-js], [controller][supplier-login].

## Additional limitations of existing safeguards

- Cart ownership is derived from an email embedded in a notes field, although the email comes from the session. A `customer_id` relationship would be more robust. Cross-account access through this mechanism was not reproduced. [Ownership query][cart-owner].
- No application-enforced idle timeout or maximum session lifetime, second factor, or mandatory email verification was found in the reviewed flows. PHP session cleanup exists but is not a complete revocation policy. Review access relies on the internal Promoflow session without a separate reviewer-role check at that boundary. [Sessions and review access][sessions].
- CSP restricts frames, objects and base URLs but not general script execution. Old JavaScript copies contain HTML interpolation; the inspected legacy index includes the modern view. This residual code was not reported as a demonstrated active XSS vulnerability. [Rules][http-rules], [legacy index][legacy-view].
- Image uploads have validation and permission checks, but a database registration failure can leave orphaned files. Order PDF upload does clean up files after transaction failure. Storage-exhaustion testing was not performed.

## Checks performed and results

Tests were inspected before execution. Tests that ordinarily use the configured database ran against a newly created, empty local database containing only a copy of the schema, with test host, port, user and database name explicitly set. SMTP was disabled; Stripe was replaced by simulated objects. Temporary databases, sessions and synthetic files were removed afterwards. No business data was copied and no production changes were tested.

| Check | Current result |
| --- | --- |
| [Security integration][security-test] | 85 checks passed: authentication, CSRF, ownership, cross-references, authorized changes, images and public catalogue. |
| [Order PDF upload][artwork-test] | 44 checks passed: session, token, sizes, spoofed types, optional files and rollback after failure. |
| [Frontend security][frontend-test] | 6 scenarios passed, including safe rendering, same-origin token handling, concurrency and no automatic mutation replay. |
| [Database configuration][config-test] | 24 checks passed, without database writes. |
| [Email rendering][email-test] | Passed with delivery replaced: content escaping, recipients and links. No real emails sent. |
| [Customer registration/login][auth-test] | Passed in a disposable database: validation, duplicates, hashes, address, session, logout and rollback after address failure. |
| [Stripe checkout][stripe-test] | Passed with simulated Stripe: amount, duplicate events, paid status and notification retries. This suite did not detect H01; a separate audit probe did. |
| [Order notifications][notice-test] | Passed with simulated recipients/delivery: isolation, duplicate prevention and retries. |
| Stripe signature, offline SDK test | 3 checks passed: valid signature, rejection of tampering and rejection of an expired timestamp. This was not a production webhook delivery. |
| [Product-status integration][status-test] | Failed at queue reading: the test expects 200 without a session, while current code requires authentication. Neither the full suite nor the subsequent HTTP flow is reported as passed. The test was not changed. |
| Additional synthetic probes | Confirmed H01, H03, H04 and H05; rejected another customer's order lookup with 404. |
| Local Apache | Catalogue 200; Git, configuration SQL, PHP test file and upload directory listing 403; security headers and HttpOnly/SameSite cookies present. |
| PHP syntax | 148 application/test files outside `controller/assets`, no errors. This does not establish logical security. |

Address and email-delivery errors printed by the relevant suites were deliberate failure simulations that tested rollback and retry behaviour. Initial environment-isolation denials were resolved through authorization, and the executions reported above completed; no blocked execution is presented as a result.

## Dependencies and remaining coverage

The inventory included Stripe PHP **16.5.0**, PHPMailer **6.8.1**, Ratchet **0.4.4**, Symfony HttpFoundation **5.4.50**, Symfony Routing **5.4.53** and Guzzle PSR-7 **2.12.3**. [Stripe][dependencies], [Ratchet dependencies][ratchet-deps], [PHPMailer][mailer-version]. Official [PHPMailer security notices](https://github.com/PHPMailer/PHPMailer/security) and the [Symfony 5.4.50 release](https://symfony.com/blog/symfony-5-4-50-released) were consulted; the latter already includes an HttpFoundation security fix. These versions are not presented as confirmed exploitable vulnerabilities. An exhaustive automated advisory audit, transitive-dependency review and verification of actual Ratchet use were not completed.

Documentation identifies an installation at `promoflow.net/dot63/`, while email configuration defaults to `lanyardsforyou.com`. [Hosting record][hosting], [link origin][public-url]. Because the current public target for this audit was not confirmed, neither was probed externally. Local review continued despite this ambiguity.

Outstanding live-site verification includes: correspondence with this code, HTTPS/redirects, cookies behind possible proxies, `.htaccess` enforcement, database permissions/privileges, credential revocation, firewall or external rate limits, backups and restoration, access logs, PHP version, actual Stripe/email configuration, and messaging-receiver restrictions. There were no destructive tests, charges, real emails, real-conversation access or incident investigation. This review does not certify the absence of vulnerabilities.


[customer-hash]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/customers.php:45
[supplier-hash]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/users.php:168
[customer-validation]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/customers/sing_up.php:103
[supplier-register]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/sign_up.php:17
[customer-login]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/customers/login.php:50
[supplier-login]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/login.php:58
[sessions]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/bootstrap.php:5
[csrf]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/bootstrap.php:51
[csrf-browser]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/global/security/request_security.js:14
[permissions]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/catalog_access.php:60
[profile]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/users/supplier_info.php:57
[uploads]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/uploads.php:9
[upload-store]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/security/uploads.php:52
[upload-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/uploads/.htaccess:1
[pdf-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/uploads/job-artworks/.htaccess:1
[pdf-email]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:312
[http-rules]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/.htaccess:1
[db-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/config/database_config.php:7
[smtp-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:407
[stripe-config]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/config/stripe.php:17
[cart-controller]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/cart.php:44
[cart-pricing]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:14
[cart-update]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:277
[cart-owner]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/jobs.php:746
[order-prepare]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:368
[order-link]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:511
[order-owner]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:129
[payment-confirm]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:225
[payment-replay]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/checkout_payments.php:167
[webhook]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/stripe_webhook.php:38
[notifications]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/order_notifications.php:19
[status-review]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/product_status.php:60
[legacy-dispatch]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/product.php:52
[legacy-product]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/model/products.php:1061
[legacy-variations]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/order/product.php:713
[promo-approval]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/promoflow/promoflow_webhook.php:20
[promo-sender]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/promoflow/requests_Promoflow_api.php:25
[promo-receiver]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/promoflow_webhook.php:20
[promo-messages]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/model/message.php:259
[promo-message-write]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/promoflow_webhook.php:91
[promo-proxy]: /Applications/XAMPP/xamppfiles/htdocs/Promoflow_v1/controller/dot63/requests_63_api.php:37
[recovery-js]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/forg_password/password/password.js:8
[recovery-view]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/forg_password/password/password.php:8
[legacy-view]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/view/preview_product_customers_/index.php:37
[prior]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/docs/security-remediation-2026-09-29.md:1
[hosting]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/docs/hostinger-templates-2026-09-29.md:5
[public-url]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/emails/send_emails.php:348
[status-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/product_status_integration.php:170
[security-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/security_integration.php:1
[frontend-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/security_frontend.cjs:1
[artwork-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/artwork_upload_integration.php:1
[auth-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/customer_auth_integration.php:1
[stripe-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/stripe_checkout_integration.php:1
[notice-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/order_notifications_integration.php:1
[config-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/database_configuration.php:1
[email-test]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/tests/email_notifications.php:1
[dependencies]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/vendor/composer/installed.json:1
[ratchet-deps]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/lib/ratcher/vendor/composer/installed.json:1
[mailer-version]: /Applications/XAMPP/xamppfiles/htdocs/Dot63_v1/controller/assets/lib/send-email/PHPMailer/VERSION:1
