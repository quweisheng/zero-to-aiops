CREATE DATABASE IF NOT EXISTS aiops_lab CHARACTER SET utf8mb4;
USE aiops_lab;

CREATE TABLE IF NOT EXISTS incident_ticket (
  id BIGINT PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  version_no BIGINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO incident_ticket (id, status, version_no)
VALUES (1, 'OPEN', 1)
ON DUPLICATE KEY UPDATE status = VALUES(status), version_no = VALUES(version_no);

START TRANSACTION;
SELECT id, status, version_no FROM incident_ticket WHERE id = 1 FOR UPDATE;
UPDATE incident_ticket SET status = 'ACKED', version_no = version_no + 1 WHERE id = 1;
COMMIT;

SELECT id, status, version_no FROM incident_ticket WHERE id = 1;
