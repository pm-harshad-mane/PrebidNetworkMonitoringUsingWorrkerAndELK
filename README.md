
# Flow
Browser (client) ---> CloudFlare Worker (server)  ----> ELK (server)

# Prebid Network Monitoring Using Cloudflare Worker and ELK

- No bucketing logic, logging absolute values in ELK
- The code will run 2000 ms after auction end, it is configurable using `executionDelayInMs`
- Using `testGroupPercentage` you can mention how many times in percentage the code should run, `10` value means only 10% times we will monitor
- Using `prebidNamespace` you can change the namespace that the publisher is using to run Prebid auctions. If publisher has IDHUB (under owpbjs namespace) and own Prebid setup(under pbjs namespace) then we should mention `pbjs` as the value
- Using `bidders` you can specify which bidders/domains to monitor
- As page can run multiple auctions, the code takes care of not gathering stats for the network calls made in previous auction
- Geographical data is added by CloudFlare Worker on the server side before pushing data to ELK
- 

# Good To Have
- we can add bid/no-bid signal in the key name as when biddder has bid-response the response size will be larger than the no-bid response.

# Sample of data stored in ELK
```
{
    "domain": "localhost",
    "publisherId": 1234,
    "browser": "chrome",
    "timestamp": 1674035034649,
    "platform": "desktop",
    "adUnitCount": 2,
    "atLeastOneBidResUsedInAuction": true,
    "auctionId": "b867f7d4-c050-41b7-9d63-afb427c29e3f",
    "bidder": {
        "name": "pubmatic",
        "order": 2,
        "request": {
            "isOverride": 1,
            "endPoint": "https://openbidtest-ams.pubmatic.com/translator?source=ow-client&correlator=568",
            "method": "POST",
            "urlLength": 79,
            "payloadLength": 957
        }
    },
    "nw": {
        "evaluated": {
            "per_lt": 2363,
            "nw_tcp": 3.400000000372529,
            "nw_que_st": 11.200000001117587,
            "nw_rs_wfs": 326.69999999925494,
            "nw_cd": 2.900000000372529,
            "nw_dur": 340.80000000074506
        },
        "raw": {
            "name": "https://openbidtest-ams.pubmatic.com/translator",
            "entryType": "resource",
            "startTime": 5202.5999999996275,
            "duration": 340.80000000074506,
            "initiatorType": "xmlhttprequest",
            "nextHopProtocol": "http/1.1",
            "renderBlockingStatus": "non-blocking",
            "workerStart": 0,
            "redirectStart": 0,
            "redirectEnd": 0,
            "fetchStart": 5202.5999999996275,
            "domainLookupStart": 5210.4000000003725,
            "domainLookupEnd": 5210.4000000003725,
            "connectStart": 5210.4000000003725,
            "connectEnd": 5213.800000000745,
            "secureConnectionStart": 5210.5999999996275,
            "requestStart": 5213.800000000745,
            "responseStart": 5540.5,
            "responseEnd": 5543.4000000003725,
            "transferSize": 1810,
            "encodedBodySize": 1510,
            "decodedBodySize": 1510,
            "responseStatus": 200,
            "serverTiming": []
        }
    },
    "serverLatency": {
        "total_time": 31,
        "read_request_time": 604
    },
    "t": 0,
    "db": 0,
    "networkType": "4g"
}
```
