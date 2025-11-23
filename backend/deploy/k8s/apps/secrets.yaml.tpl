apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  # DSNs
  catalog-dsn: "${CATALOG_DSN}"
  library-dsn: "${LIBRARY_DSN}"
  media-dsn:   "${MEDIA_DSN}"
  history-dsn: "${HISTORY_DSN}"

  # MinIO
  minio-access-key: "${MINIO_ACCESS_KEY}"
  minio-secret-key: "${MINIO_SECRET_KEY}"