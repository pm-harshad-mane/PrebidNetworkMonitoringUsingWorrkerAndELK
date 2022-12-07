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
      },
      {
        key: 'per_lt',
        name: 'Perceived Latency',
        timeEndKey: 'responseEnd',
        timeStartKey: 'fetchStart'
      }
    ],

    'bidders': [],

    'bidderTracker': {},

    'order': 0,

    'adUnitCount': 0,

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

    'networkType': navigator.connection.effectiveType,

    getTimeValue: function (endTime, startTime) {
      if (isNaN(endTime) || isNaN(startTime)) return -1;
      if (endTime === 0 || startTime === 0) return -1;
      return endTime - startTime;
    },

    uploadTheNetworkLatencyData: function (jsonData) {
      PM_Network_POC.reset();
      fetch('https://pm-network-latency-monitoring.harshad.workers.dev/', {
        'headers': {
          'content-type': 'application/json'
        },
        'method': 'POST',
        'body': JSON.stringify(jsonData)
      })
        .then(res => { })
        .then(response => { })
        .catch(() => { });
    },

    reset: function () {
      this.order = 0;
      this.adUnitCount = 0;
    },

    performNetworkAnalysis: function () {
      let outputObj = {
        domain: PM_Network_POC.domain,
        publisherId: PM_Network_POC.publisherId,
        browser: PM_Network_POC.browserName,
        platform: PM_Network_POC.platform,
        networkType: PM_Network_POC.networkType,
        adUnitCount: PM_Network_POC.adUnitCount,
        timestamp: Date.now(),
        bidders: []
      };

      let performanceResources = window?.performance?.getEntriesByType('resource');

      let i = PM_Network_POC.lastExecutionMaxIndex;

      for (; i < performanceResources.length; i++) {
        let perfResource = performanceResources[i];
        let currentIndex;
        let duplicate = false;

        PM_Network_POC.lastExecutionMaxIndex++;

        let sspConfig = PM_Network_POC.bidders.find(
          (bidder, index) => {
            currentIndex = index;
            return perfResource.name.includes(bidder.searchName)
          }
        ) || null;

        if (sspConfig) {
          let biddersObj;

          let nwObj = {
            method: sspConfig.method,
            reqPayloadCharCount: sspConfig.reqPayloadCharCount,
            resUsedInPbjsAuction: PM_Network_POC.bidderTracker[sspConfig.name] ? (PM_Network_POC.bidderTracker[sspConfig.name].resUsedInPbjsAuction || 0) : 0,
            order: sspConfig.order,
            nw: {
              evaluated: {},
              raw: {}
            }
          }

          PM_Network_POC.statHatParameters.forEach(parameter => {
            const value = PM_Network_POC.getTimeValue(
              perfResource[parameter.timeEndKey],
              perfResource[parameter.timeStartKey]
            );
            if (value > 0) {
              nwObj.nw.evaluated['nw_' + parameter.key] = value;
            }
          });

          nwObj.nw.raw = perfResource;

          duplicate = outputObj.bidders.find(
            bidder => sspConfig.name === bidder.name
          ) || null;

          if (!duplicate) {
            biddersObj = {
              name: sspConfig.name,
              // key: sspConfig.key
              callCount: 1,
              calls: []
            };
            biddersObj.calls.push(nwObj);
            outputObj.bidders.push(biddersObj);
          } else {
            duplicate.callCount++;
            duplicate.calls.push(nwObj);
          }

          PM_Network_POC.bidders.splice(currentIndex, 1);
        }

        if (i === performanceResources.length - 1 && outputObj.bidders.length > 0) {
          PM_Network_POC.uploadTheNetworkLatencyData(outputObj);
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
        PM_Network_POC.order++;
        PM_Network_POC.bidders.push({
          name: bidderRequest.bidderCode,
          searchName: requestObject.url,
          order: PM_Network_POC.order,
          reqPayloadCharCount: requestObject.data.length,
          method: requestObject.method
        });

        const bidderKeys = Object.keys(PM_Network_POC.bidderTracker);
        if (bidderKeys.indexOf(bidderRequest.bidderCode) === -1) {
          PM_Network_POC.bidderTracker[bidderRequest.bidderCode] = {
            reqSent: 1
          }
        }
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('bidResponse', (bidResponse) => {
        const bidderKeys = Object.keys(PM_Network_POC.bidderTracker);
        if (bidderKeys.indexOf(bidResponse.bidderCode) !== -1) {
          PM_Network_POC.bidderTracker[bidResponse.bidderCode].resUsedInPbjsAuction = 1;
        }
      });

      window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionEnd', function (data) {
        var randomNumberBelow100 = Math.floor(Math.random() * 100);
        if (randomNumberBelow100 <= PM_Network_POC.testGroupPercentage) {
          PM_Network_POC.adUnitCount = data.adUnits.length;
          setTimeout(
            PM_Network_POC.performNetworkAnalysis,
            PM_Network_POC.executionDelayInMs
          );
        }
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`onEvent function is not present in window.${PM_NW_POC_PREBID_NAMESPACE} object`);
    }
  });
})();
