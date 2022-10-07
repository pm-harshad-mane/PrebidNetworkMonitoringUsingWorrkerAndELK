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

  // N second after auction end, get the stats for given domains
  'executionDelayInMs': 2000,

  // run the Network analysis only for the mentioned percentage of traffic
  'testGroupPercentage': 100,

  'statHatParameters': [
    {
      key: "dns",
      name: "DNS Lookup",
      timeEndKey: "domainLookupEnd",
      timeStartKey: "domainLookupStart"
    },
    {
      key: "tcp",
      name: "TCP Connection",
      timeEndKey: "connectEnd",
      timeStartKey: "connectStart"
    },
    {
      key: "que_st",
      name: "Queueing and stalled",
      timeEndKey: "requestStart",
      timeStartKey: "startTime"
    },
    {
      key: "rs_wfs",
      name: "Request Sent and Waiting For Server",
      timeEndKey: "responseStart",
      timeStartKey: "requestStart"
    },
    {
      key: "cd",
      name: "Content Download",
      timeEndKey: "responseEnd",
      timeStartKey: "responseStart"
    },
    {
      key: "dur",
      name: "Duration",
      timeEndKey: "responseEnd",
      timeStartKey: "startTime"
    }
  ],

  // bidders to monitor, bidderName => domain to monitor
  'bidders': [
    {
      key: "pm",
      name: "PubMatic",
      searchName: "hbopenbid.pubmatic.com"
    },
    {
      key: "tl",
      name: "TripleLift",
      searchName: "tlx.3lift.com"
    },
    {
      key: "an",
      name: "AppNexus",
      searchName: "ib.adnxs.com"
    },
    {
      key: "rc",
      name: "Rubicon",
      searchName: "fastlane.rubiconproject.com"
    }
  ],

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
    let userAgent = navigator?.userAgent || "others";
    if (userAgent.match(/firefox|fxios/i)) return "firefox";
    if (userAgent.match(/chrome|chromium|crios/i)) return "chrome";
    if (userAgent.match(/safari/i)) return "safari";
    if (userAgent.match(/opr\//i)) return "opera";
    if (userAgent.match(/edg/i)) return "edge";
    return "others";
  })(),

  // to make sure that we do not read the stats for the same network call again
  'lastExecutionMaxIndex': 0,

  getTimeValue: function (endTime, startTime) {
    if (isNaN(endTime) || isNaN(startTime)) return -1;
    if (endTime === 0 || startTime === 0) return -1;
    return endTime - startTime;
  },

  uploadTheNetworkLatencyData: function (jsonData) {
    fetch("https://pm-network-latency-monitoring.harshad.workers.dev/", {
      "headers": {
        "content-type": "application/json"
      },
      "method": "POST",
      "body": JSON.stringify(jsonData)
    })
      .then(res => { })
      .then(response => { })
      .catch(error => { });
  },

  performNetworkAnalysis: function () {
    let output = {
      domain: PM_Network_POC.domain,
      browser: PM_Network_POC.browserName,
      timestamp: Date.now(),
      bidder: {},
      nw: {
        evaluated: {},
        raw: {}
      }
    };

    let performanceResources = window?.performance?.getEntriesByType("resource");

    let i = PM_Network_POC.lastExecutionMaxIndex;
    for (; i < performanceResources.length; i++) {
      let perfResource = performanceResources[i];
      PM_Network_POC.lastExecutionMaxIndex++;

      let sspConfig = PM_Network_POC.bidders.find(
        bidder => perfResource.name.includes(bidder.searchName)
      ) || null;

      if (sspConfig) {

        output.bidder = {
          name: sspConfig.name,
          key: sspConfig.key
        };

        PM_Network_POC.statHatParameters.forEach(parameter => {
          const value = PM_Network_POC.getTimeValue(
            perfResource[parameter.timeEndKey],
            perfResource[parameter.timeStartKey]
          );
          if (value > 0) {
            output.nw.evaluated['nw_' + parameter.key] = value;
          }
        });

        output.nw.raw = perfResource;
        PM_Network_POC.uploadTheNetworkLatencyData(output);
      }
    }
  }
};

var PM_NW_POC_PREBID_NAMESPACE = PM_Network_POC.prebidNamespace;
if (!window[PM_NW_POC_PREBID_NAMESPACE]) {
  console.warn(`prebidNamespace used by OW is different with the configured one. Possible values could be owpbjs, ihowpbjs, pbjs. Configured prebidNamespace is ${PM_NW_POC_PREBID_NAMESPACE}`);
}
window[PM_NW_POC_PREBID_NAMESPACE] = window[PM_NW_POC_PREBID_NAMESPACE] || {};
window[PM_NW_POC_PREBID_NAMESPACE].que = window[PM_NW_POC_PREBID_NAMESPACE].que || [];
window[PM_NW_POC_PREBID_NAMESPACE].que.push(function () {
  if (typeof window[PM_NW_POC_PREBID_NAMESPACE].onEvent === 'function') {
    window[PM_NW_POC_PREBID_NAMESPACE].onEvent('auctionEnd', function (data) {
      var randomNumberBelow100 = Math.floor(Math.random() * 100);
      if (randomNumberBelow100 <= PM_Network_POC.testGroupPercentage) {
        setTimeout(
          PM_Network_POC.performNetworkAnalysis,
          PM_Network_POC.executionDelayInMs
        );
      }
    });
  } else {
    console.warn(`onEvent function is not present in window.${PM_NW_POC_PREBID_NAMESPACE} object`);
  }
});
