# Proposed AWS architecture

| Service | Role |
|---|---|
| S3 | Encrypted storage for each organization’s materials |
| Bedrock | Topic classification and plain-language summaries |
| OpenSearch | Semantic search over approved resources only |
| Lambda and DynamoDB | Review status, reviewer notes and the approval log |

One AWS account per customer, encrypted at rest and in transit. The public demo calls none of these services.
