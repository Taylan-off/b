#!/bin/bash
basename=$(basename $0)
ret=1
echo "# build all services (front_candidat,front_admin,api,db) in prod mode"
time make build-all NPM_AUDIT_DRY_RUN=true
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename build-all ERROR"
  exit $ret
fi
docker images

# Set run test env
export FRONT_ADMIN_PORT=81
export DBDATA=../test-db

ret=1
echo "# run all separated services (front_candidat,front_admin,api,db) in prod mode"
time make up-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename up-all ERROR"
  exit $ret
fi
docker ps

ret=1
echo "# test all services up&running"
time make test-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename test-all ERROR"
  exit $ret
fi

ret=1
echo "# remove all services"
time make down-all
ret=$?
if [ "$ret" -gt 0 ] ; then
  echo "$basename down-all ERROR"
  exit $ret
fi

exit $ret