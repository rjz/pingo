Pingo
====================================

Just-for-fun ping scheduler with a REST-ful frontend.

    $ go run main.go

Queue some pings:

    $ curl -XPOST http://localhost:30080/tasks \
        -d'{"name":"png","type":"ping","data":{"url":"http://localhost:80"}}'

See them queued up:

    $ curl http://localhost:30080/tasks

### License

WTFPL

