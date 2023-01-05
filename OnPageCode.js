(function () {
  function getDeviceType () {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const device = {};

    function findMatch(arr) {
      for (let i = 0; i < arr.length; i++) {
        if (device[arr[i]]()) {
          return arr[i]
        }
      }
      return 'others';
    };

    function find(needle) {
      return includes(userAgent, needle);
    };

    function includes(haystack, needle) {
      return haystack.indexOf(needle) !== -1;
    };

    // android
    device.android = function() {
      return !device.windows() && find('android');
    };

    device.androidPhone = function() {
      return device.android() && find('mobile');
    };

    device.androidTablet = function() {
      return device.android() && !find('mobile');
    };

    // apple
    device.iphone = function() {
      return !device.windows() && find('iphone');
    };

    device.ipad = function() {
      const iPadOS13Up =
        navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
      return find('ipad') || iPadOS13Up;
    };

    // windows
    device.windows = function() {
      return find('windows');
    };

    // mobile
    device.mobile = function() {
      return device.androidPhone() || device.iphone();
    };

    // tablet
    device.tablet = function() {
      return device.ipad() || device.androidTablet();
    };

    device.desktop = function() {
      return !device.tablet() && !device.mobile();
    };

    return findMatch(['mobile', 'tablet', 'desktop']);
  };

  // eslint-disable-next-line camelcase
  var PM_Network_POC = {

    'timeoutCorrelators': {},

    // IMP: Which namespace to be used, can be identify using,
    // 1. Go to publisher URL.
    // 2. Open developer tool and select console tab
    // 3. Execute below code in the console,
    //    3.1 window.owpbjs
    //    If it returns object with some properties, use owpbjs as prebidNamespace
    //    else, try changing namespace with pbjs (code: window.pbjs)
    //    3.2 In case of IDHUB only, use code, window.ihowpbjs
    // 4. Or connect to JS developer

    'prebidNamespace': 'pbjs',

    'publisherId': 1234,

    // N second after auction end, get the stats for given domains
    'executionDelayInMs': 2000,

    // run the Network analysis only for the mentioned percentage of traffic
    'testGroupPercentage': 100,

    'cache': {
      auction: {}
    },

    'statHatParameters': [
      {
        key: 'dns',
        name: 'DNS Lookup',
        timeEndKey: 'domainLookupEnd',
        timeStartKey: 'domainLookupStart'
      },
      {
        key: 'tcp',
        name: 'TCP Connection',
        timeEndKey: 'connectEnd',
        timeStartKey: 'connectStart'
      },
      {
        key: 'que_st',
        name: 'Queueing and stalled',
        timeEndKey: 'requestStart',
        timeStartKey: 'startTime'
      },
      {
        key: 'rs_wfs',
        name: 'Request Sent and Waiting For Server',
        timeEndKey: 'responseStart',
        timeStartKey: 'requestStart'
      },
      {
        key: 'cd',
        name: 'Content Download',
        timeEndKey: 'responseEnd',
        timeStartKey: 'responseStart'
      },
      {
        key: 'dur',
        name: 'Duration',
        timeEndKey: 'responseEnd',
        timeStartKey: 'startTime'
      }
    ],

    'populateBidderDataForAuction': (bidderObj, requestObj) => {
      PM_Network_POC.order++;
      const bidder = PM_Network_POC.bidders.find(bidder => bidder.bidderCode === bidderObj.bidderCode);

      if (!bidder) {
        PM_Network_POC.bidders.push({
          bidderCode: bidderObj.bidderCode,
          searchName: requestObj.url,
          atLeastOneBidResUsedInAuction: false,
          bids: [
            {
              order: PM_Network_POC.order,
              reqPayloadCharCount: requestObj.data.length,
              reqMethod: requestObj.method
            }
          ]
        });
      } else {
        bidder.bids.push({
          order: PM_Network_POC.order,
          reqPayloadCharCount: requestObj.data.length,
          reqMethod: requestObj.method
        });
      }
    },

    'bidders': [],

    'bidderTracker': {},

    'order': 0,

    'adUnitCount': 0,

    'setAuctionStartTime': function (args) {
      PM_Network_POC.cache.auction.timestamp = args.timestamp;
    },

    // need to log domain in stats
    'domain': (function () {
      const replaceList = ['https://', 'http://'];
      let hostName = window?.location?.hostname;
      replaceList.forEach(replaceThis => {
        hostName = hostName.replace(replaceThis, '');
      });
      return hostName;
    })(),

    'browserName': (function () {
      let userAgent = navigator?.userAgent || 'others';
      if (userAgent.match(/firefox|fxios/i)) return 'firefox';
      if (userAgent.match(/chrome|chromium|crios/i)) return 'chrome';
      if (userAgent.match(/safari/i)) return 'safari';
      if (userAgent.match(/opr\//i)) return 'opera';
      if (userAgent.match(/edg/i)) return 'edge';
      return 'others';
    })(),

    'platform': (function () {
      return getDeviceType();
    })(),

    // to make sure that we do not read the stats for the same network call again
    'lastExecutionMaxIndex': 0,

    'networkType': navigator?.connection?.effectiveType,

    getTimeValue: function (endTime, startTime) {
      if (isNaN(endTime) || isNaN(startTime)) return -1;
      if (endTime === 0 || startTime === 0) return -1;
      return endTime - startTime;
    },

    uploadTheNetworkLatencyData: function (jsonData) {
      fetch('https://pm-network-latency-monitoring.harshad.workers.dev/', {
        'headers': {
          'content-type': 'application/json'
        },
        'method': 'POST',
        'body': JSON.stringify(jsonData)
      })
        .then(res => { })
        .then(response => { })
        // eslint-disable-next-line handle-callback-err
        .catch(error => { });
    },

    reset: function () {
      this.order = 0;
      this.adUnitCount = 0;
      this.bidders = [];
    },

    getParameterByName: function (name, url) {
      name = name.replace(/[\[\]]/g, '\\$&');
      var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
      var results = regex.exec(url);
      if (!results) {
        return null;
      }
      if (!results[2]) {
        return '';
      }
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },

    'bidCallTracker': [],

    prepareNetworkLatencyData: function (perfResource, sspConfig, bidderRequest, latency, processedBidsCount) {
      let currentBidCall = {};
      let output = {
        domain: PM_Network_POC.domain,
        publisherId: PM_Network_POC.publisherId,
        browser: PM_Network_POC.browserName,
        platform: PM_Network_POC.platform,
        adUnitCount: PM_Network_POC.adUnitCount,
        atLeastOneBidResUsedInAuction: sspConfig.atLeastOneBidResUsedInAuction,
        bidder: sspConfig.bidderCode,
        bidCalls: PM_Network_POC.bidCallTracker,
        serverLatency: latency || {},
        t: PM_Network_POC.timeoutCorrelators[bidderRequest?.nwMonitor?.correlator] ? 1 : 0,
        db: perfResource?.name?.length ? 0 : 1
      };

      if (PM_Network_POC.networkType) output['networkType'] = PM_Network_POC.networkType;

      currentBidCall.order = sspConfig.bids[processedBidsCount - 1].order;
      currentBidCall.reqMethod = sspConfig.bids[processedBidsCount - 1].reqMethod;
      currentBidCall.timestamp = Date.now();
      currentBidCall.nw = {
        evaluated: {
          // percieved latency
          per_lt: Date.now() - PM_Network_POC.cache.auction.timestamp
        },
        raw: {}
      };
      currentBidCall.requestUrlPayloadLength = bidderRequest?.nwMonitor?.requestUrlPayloadLength || sspConfig.bids[processedBidsCount - 1].reqPayloadCharCount;

      PM_Network_POC.statHatParameters.forEach(parameter => {
        const value = PM_Network_POC.getTimeValue(
          perfResource[parameter.timeEndKey],
          perfResource[parameter.timeStartKey]
        );
        if (value > 0) {
          currentBidCall.nw.evaluated['nw_' + parameter.key] = value;
        }
      });

      const jsonPerfResource = JSON.stringify(perfResource);
      const raw = JSON.parse(jsonPerfResource);
      raw.name = PM_Network_POC.removeQueryParams(perfResource.name);
      currentBidCall.nw.raw = raw;
      PM_Network_POC.bidCallTracker.push(currentBidCall);

      if (processedBidsCount === bidderRequest.bids.length) {
        PM_Network_POC.uploadTheNetworkLatencyData(output);
        PM_Network_POC.bidCallTracker = [];
      }
    },

    removeQueryParams: url => url.split('?')[0],

    isPubMaticBidder: function (bidderCode) {
      return bidderCode === 'pubmatic';
    },

    getBidderByBidRequest: function (bidderRequest) {
      return PM_Network_POC.bidders.find(bidder => bidder.bidderCode === bidderRequest.bidderCode);
    },

    performNetworkAnalysis: function (bidderRequests, bidsReceived) {
      const bidReceived = bidsReceived?.find(bidReceived => PM_Network_POC.isPubMaticBidder(bidReceived?.bidderCode));
      // latency = latency || {};
      let performanceResources = window?.performance?.getEntriesByType('resource');
      let lastExecutionIndex = PM_Network_POC.lastExecutionMaxIndex;
      // PM_Network_POC.lastExecutionMaxIndex = performanceResources.length;

      for (let index = 0; index < bidderRequests.length; index++) {
        const bidderRequest = bidderRequests[index];
        let processedBidsCount = 0;
        let sspConfig = PM_Network_POC.getBidderByBidRequest(bidderRequest);

        if (!sspConfig) break;

        let perfResourceFound = false;
        for (let i = lastExecutionIndex; i < performanceResources.length; i++) {
          let perfResource = performanceResources[i];

          if (perfResource.name.includes(sspConfig.searchName)) {
            PM_Network_POC.lastExecutionMaxIndex = i;
            if (PM_Network_POC.isPubMaticBidder(sspConfig.bidderCode)) {
              const value = PM_Network_POC.getParameterByName('correlator', perfResource.name);
              if (value == bidderRequest?.nwMonitor?.correlator) {
                perfResourceFound = true;
                processedBidsCount++;
                PM_Network_POC.prepareNetworkLatencyData(perfResource, sspConfig, bidderRequest, bidReceived?.ext?.latency, processedBidsCount);

                if (processedBidsCount === bidderRequest.bids.length) {
                  break;
                }
              }
            // else {
            //   PM_Network_POC.prepareNetworkLatencyData(perfResource, sspConfig, null);
            // }
            } else {
              perfResourceFound = true;
              processedBidsCount++;
              PM_Network_POC.prepareNetworkLatencyData(perfResource, sspConfig, bidderRequest, null, processedBidsCount);

              if (processedBidsCount === bidderRequest.bids.length) {
                break;
              }
            }
          }
        }
        if (perfResourceFound === false) {
          processedBidsCount++;
          PM_Network_POC.prepareNetworkLatencyData({}, sspConfig, bidderRequest, null, processedBidsCount);
        }
      }
    }
  };

  var PM_NW_POC_PREBID_NAMESPACE = PM_Network_POC.prebidNamespace;

  if (!window[PM_NW_POC_PREBID_NAMESPACE]) {
    // eslint-disable-next-line no-console
    console.warn(`prebidNamespace used by OW is different with the configured one. Possible values could be owpbjs, ihowpbjs, pbjs. Configured prebidNamespace is ${PM_NW_POC_PREBID_NAMESPACE}`);
  }

  window[PM_NW_POC_PREBID_NAMESPACE] = window[PM_NW_POC_PREBID_NAMESPACE] || {};
  window[PM_NW_POC_PREBID_NAMESPACE].que = window[PM_NW_POC_PREBID_NAMESPACE].que || [];

  window[PM_NW_POC_PREBID_NAMESPACE].que.push(function () {
    if (typeof window[PM_NW_POC_PREBID_NAMESPACE].onEvent === 'function') {
      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('beforeBidderHttp', (bidderRequest, requestObject) => {
        PM_Network_POC.populateBidderDataForAuction(bidderRequest, requestObject);
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('bidResponse', (bidResponse) => {
        const bidder = PM_Network_POC.bidders.find(bidder => bidder.bidderCode === bidResponse.bidderCode);
        bidder.atLeastOneBidResUsedInAuction = true;
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionInit', data => {
        if (PM_Network_POC.bidders.length > 0) PM_Network_POC.reset();
        // needed to capture percieved latency
        PM_Network_POC.setAuctionStartTime(data);
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('bidTimeout', function (args) {
        let uniqueBiddersBids = [...new Map(args.map(item => [item['bidder'], item])).values()];

        if (uniqueBiddersBids) {
          uniqueBiddersBids.forEach(bid => PM_Network_POC.timeoutCorrelators[bid.correlator] = 1);
        }
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionEnd', function (data) {
        var randomNumberBelow100 = Math.floor(Math.random() * 100);
        if (randomNumberBelow100 <= PM_Network_POC.testGroupPercentage) {
          PM_Network_POC.adUnitCount = data.adUnits.length;
          setTimeout(
            PM_Network_POC.performNetworkAnalysis.bind(null, data?.bidderRequests, data?.bidsReceived),
            PM_Network_POC.executionDelayInMs
          );
        // PM_Network_POC.performNetworkAnalysis(bid?.ext?.latency, bid?.ext?.correlator);
        }
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`onEvent function is not present in window.${PM_NW_POC_PREBID_NAMESPACE} object`);
    }
  });
})();
