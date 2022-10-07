
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
  "domain": "www.mumsnet.com",
  "browser": "chrome",
  "timestamp": 1665108035,
  "bidders": [
    {
      "name": "AppNexus",
      "key": "an",
      "nw_dur": 333.5
    },
    {
      "name": "PubMatic",
      "key": "pm",
      "nw_dur": 220.30000007152557
    },
    {
      "name": "TripleLift",
      "key": "tl",
      "nw_dur": 331.59999990463257
    }
  ],
  "cf_timezone": "America/Los_Angeles",
  "cf_region": "California",
  "cf_latitude": "37.31770",
  "cf_longitude": "-122.04380",
  "cf_continent": "NA",
  "cf_city": "Cupertino",
  "cf_country": "US",
  "cf_colo": "SJC"
}
```
