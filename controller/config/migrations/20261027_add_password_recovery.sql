-- Additive, safe to run more than once. No account data is changed.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    account_type VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    account_id INT NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    password_fingerprint CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expires_at BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (account_type, account_id),
    UNIQUE KEY password_reset_token_hash (token_hash),
    KEY password_reset_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_requests (
    bucket_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    attempts INT UNSIGNED NOT NULL,
    window_started BIGINT UNSIGNED NOT NULL,
    KEY password_reset_request_window (window_started)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
