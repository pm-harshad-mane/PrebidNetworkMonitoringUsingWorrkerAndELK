addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const data = {
    colo: request.cf.colo,
    country: request.cf.country,
    city: request.cf.city,
    continent: request.cf.continent,
    latitude: request.cf.latitude,
    longitude: request.cf.longitude,
    postalCode: request.cf.postalCode,
    metroCode: request.cf.country,
    region: request.cf.region,
    regionCode: request.cf.regionCode,
    timezone: request.cf.timezone
  };

  const json = JSON.stringify(data, null, 2);

  return new Response(json, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Content-Type': 'application/json'
      },
    }
  );
}
