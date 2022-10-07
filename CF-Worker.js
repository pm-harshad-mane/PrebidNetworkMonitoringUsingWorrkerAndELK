export default {
  async fetch(request, env) {
    return await handleRequest(request)
  }
}

async function handleRequest(request) {
  console.log(request)
  let response
  if (request.method === "OPTIONS") {
    response = handleOptions(request)
  }else if (request.method === "POST") {

    // read the json data from post
    let dataToPush = await request.json() || {};
    // adding extra data from request.cf to post data
    [
        "timezone", "region", "latitude", 
        "longitude", "continent", "city", 
        "isEUCountry", "country", "colo"
    ].forEach(keyname => {
        dataToPush["cf_"+keyname] = request.cf[keyname]
    })

    await pushDataToELK(dataToPush);
    const data = {};
    const json = JSON.stringify(data, null, 2);
    response = new Response(json, {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    })
    response = new Response(response.body, response)
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  } else {
    response = new Response("Nothing to do here...")
  }
  return response
}

const testDomainName = "*"
const corsHeaders = {
  "Access-Control-Allow-Origin": testDomainName,
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

function handleOptions (request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
      // Handle CORS pre-flight request.
      // If you want to check or reject the requested method + headers
      // you can do that here.
      let respHeaders = {
        ...corsHeaders,
        // Allow all future content Request headers to go back to browser
        // such as Authorization (Bearer) or X-Client-Name-Version
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
      }
      return new Response(null, {
        headers: respHeaders,
      })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
              Allow: "GET, HEAD, POST, OPTIONS",
      },
    })
  }
}

async function pushDataToELK(jsonData){
  const fetchResponse = await fetch("https://528a4d5f7065437ba453fbd88a3fa021.us-central1.gcp.cloud.es.io:443/simple-poc/_doc", {
    "headers": {
      "Authorization": "ApiKey dl9NRXI0TUI1SGFNR2pRTy1kcVY6XzNaZVFxNXJSR2FPOXJydm41Nm5RZw==",
      "content-type": "application/json"
    },
    "body": JSON.stringify(jsonData),
    "method": "POST"
  });
  console.log(fetchResponse)
}
