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
      if (PM_Network_POC.bidderWhiteList.includes(bidderObj.bidderCode)) {
        if (!Object.keys(PM_Network_POC.auction).includes(bidderObj.auctionId)) {
          PM_Network_POC.auction[bidderObj.auctionId] = {
            bidderRequests: []
          };

          // attempt to remove old auction data if it has already been used
          const auctionObjKeys = Object.keys(PM_Network_POC.auction);
          auctionObjKeys.forEach(key => {
            if (key !== bidderObj.auctionId && PM_Network_POC.auction[key].done) delete PM_Network_POC.auction[key]
          });
        }

        PM_Network_POC.auction[bidderObj.auctionId].bidderRequests.push({
          order: PM_Network_POC.auction[bidderObj.auctionId].bidderRequests.length + 1,
          bidderCode: bidderObj.bidderCode,
          searchName: requestObj.url,
          auctionId: bidderObj.auctionId,
          reqMethod: requestObj.method,
          reqPayloadCharCount: requestObj.data.length
        });
      }
    },

    'auction': {},

    'bidderResponses': [],

    'bidderWhiteList': ['pubmatic', 'appnexus', 'triplelift', 'rubicon'],

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
      // eslint-disable-next-line no-console
      console.log('PM_Network_POC: ', PM_Network_POC);
      // eslint-disable-next-line no-console
      console.log('jsonData: ', jsonData);
      // fetch('https://pm-network-latency-monitoring.harshad.workers.dev/', {
      //   'headers': {
      //     'content-type': 'application/json'
      //   },
      //   'method': 'POST',
      //   'body': JSON.stringify(jsonData)
      // })
      //   .then(res => { })
      //   .then(response => { })
      //   // eslint-disable-next-line handle-callback-err
      //   .catch(error => { });

      if (PM_Network_POC.auction[jsonData.auctionId].bidderRequests.length === jsonData.bidder.order) {
        PM_Network_POC.auction[jsonData.auctionId].done = true;
      }
    },

    getParameterByName: function (name, url) {
      name = name.replace(/[\[\]]/g, '\\$&');
      var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
      var results = regex.exec(url);
      if (!results) { return null; }
      if (!results[2]) { return ''; }
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },

    isBidTimeout: function (bidderRequest) {
      return bidderRequest?.bids?.some(bid => bid.t === 1);
    },

    prepareNetworkLatencyData: function (perfResource, bidderRequest, sspConf, latency) {
      let output = {
        domain: PM_Network_POC.domain,
        publisherId: PM_Network_POC.publisherId,
        browser: PM_Network_POC.browserName,
        timestamp: Date.now(),
        platform: PM_Network_POC.platform,
        adUnitCount: PM_Network_POC.auction[sspConf.auctionId].adUnitCount,
        atLeastOneBidResUsedInAuction: PM_Network_POC.bidderResponses.includes(sspConf.bidderCode),
        auctionId: sspConf.auctionId,
        bidder: {
          name: sspConf.bidderCode,
          order: sspConf.order,
          request: {
            isOverride: bidderRequest?.nwMonitor?.reqOverride,
            endPoint: sspConf.searchName,
            method: sspConf.reqMethod,
            requestUrlPayloadLength: sspConf.searchName.length,
            reqPayloadLength: sspConf.reqPayloadCharCount
          }
        },
        nw: {
          evaluated: {
            // percieved latency
            per_lt: Date.now() - PM_Network_POC.cache.auction.timestamp
          },
          raw: {}
        },
        serverLatency: latency || {},
        t: PM_Network_POC.isBidTimeout(bidderRequest) ? 1 : 0,
        db: perfResource?.name?.length ? 0 : 1
      };

      if (PM_Network_POC.networkType) output['networkType'] = PM_Network_POC.networkType;

      PM_Network_POC.statHatParameters.forEach(parameter => {
        const value = PM_Network_POC.getTimeValue(
          perfResource[parameter.timeEndKey],
          perfResource[parameter.timeStartKey]
        );
        if (value > 0) {
          output.nw.evaluated['nw_' + parameter.key] = value;
        }
      });

      const jsonPerfResource = JSON.stringify(perfResource);
      const raw = JSON.parse(jsonPerfResource);
      raw.name = PM_Network_POC.removeQueryParams(perfResource.name);
      output.nw.raw = raw;

      PM_Network_POC.uploadTheNetworkLatencyData(output);
    },

    removeQueryParams: url => url.split('?')[0],

    isPubMaticBidder: function (bidderCode) {
      return bidderCode === 'pubmatic';
    },

    performNetworkAnalysis: function (bidderRequests, bidsReceived) {
      const auctionId = bidderRequests[0].auctionId;
      const bidReceived = bidsReceived?.find(bidReceived => PM_Network_POC.isPubMaticBidder(bidReceived?.bidderCode));
      // latency = latency || {};
      let performanceResources = window?.performance?.getEntriesByType('resource');
      let lastExecutionIndex = PM_Network_POC.lastExecutionMaxIndex;
      // PM_Network_POC.lastExecutionMaxIndex = performanceResources.length;

      for (let index = 0; index < PM_Network_POC?.auction[auctionId].bidderRequests.length; index++) {
        const nwBidderRequest = PM_Network_POC.auction[auctionId].bidderRequests[index];
        const bidderRequest = bidderRequests.find(bidder => bidder.bidderCode === nwBidderRequest.bidderCode);

        let perfResourceFound = false;
        for (let i = lastExecutionIndex; i < performanceResources.length; i++) {
          let perfResource = performanceResources[i];

          const sspConfig = perfResource.name.includes(nwBidderRequest.searchName) ? nwBidderRequest : false;
          if (!sspConfig) continue;

          // if (perfResource.name.includes(sspConfig.searchName)) {
          PM_Network_POC.lastExecutionMaxIndex = i;
          // console.log(bidderRequest, sspConfig);
          if (PM_Network_POC.isPubMaticBidder(sspConfig.bidderCode)) {
            const value = PM_Network_POC.getParameterByName('correlator', perfResource.name);
            if (value == bidderRequest?.nwMonitor?.correlator) {
              perfResourceFound = true;
              PM_Network_POC.prepareNetworkLatencyData(perfResource, bidderRequest, sspConfig, bidReceived?.ext?.latency);

              break;
            }
            // else {
            //   PM_Network_POC.prepareNetworkLatencyData(perfResource, sspConfig, null);
            // }
          } else {
            perfResourceFound = true;
            PM_Network_POC.prepareNetworkLatencyData(perfResource, bidderRequest, sspConfig, null);

            break;
          }
          // }
        }
        if (perfResourceFound === false) {
          PM_Network_POC.prepareNetworkLatencyData({}, bidderRequest, {}, null);
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
        if (PM_Network_POC.bidderResponses.indexOf(bidResponse.bidderCode) === -1) PM_Network_POC.bidderResponses.push(bidResponse.bidderCode);
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionInit', data => {
        // needed to capture percieved latency
        PM_Network_POC.setAuctionStartTime(data);
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('bidTimeout', function (args) {
        args?.forEach(bidRequest => bidRequest.t = 1);
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionEnd', function (data) {
        var randomNumberBelow100 = Math.floor(Math.random() * 100);
        if (randomNumberBelow100 <= PM_Network_POC.testGroupPercentage) {
          // PM_Network_POC.adUnitCount = data.adUnits.length;
          PM_Network_POC.auction[data.auctionId].adUnitCount = data.adUnits.length;
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

  // Cehck if translator request is override then add its entry in the bidder list.
  // setTimeout(() => {
  //   const dynamicBidderEntry = PM_Network_POC.bidderRequests[1];
  //   const overrideRequestConfig = window?.[PM_NW_POC_PREBID_NAMESPACE]?.getConfig()?.translatorGetRequest;
  //   if (!overrideRequestConfig) return;
  //   dynamicBidderEntry.searchName = overrideRequestConfig?.endPoint || dynamicBidderEntry.searchName;
  // }, 0);
})();
