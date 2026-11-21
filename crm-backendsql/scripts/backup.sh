#!/bin/sh
# TODO: MySQL backup script (cron + S3 upload)
# mysqldump --single-transaction -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" | gzip > backup-$(date +%F).sql.gz
