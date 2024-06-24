#!/bin/sh
exec gunicorn \
  -u nobody \
  -g nobody \
  --access-logfile '-' \
  --error-logfile '-' \
  --log-file "-" \
  --access-logformat '%({x-forwarded-for}i)s %(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"' \
  --forwarded-allow-ips="140.211.9.104,2605:bc80:3010:104::8cd3:968" \
  -w 4 \
  -b 0.0.0.0:5000 \
  'wsgi:app'
