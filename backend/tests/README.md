# API tests

Run `npm run test:backend` from the repository root.

API tests use a temporary filesystem media directory and an in-memory MongoDB collection stub to validate HTTP semantics without requiring a running MongoDB server. A full deployment still needs integration and security testing against MongoDB and HTTPS infrastructure.

No published story or test upload is sent to third parties.
