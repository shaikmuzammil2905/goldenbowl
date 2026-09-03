export default async function handler(req, res) {
  // Since this is inside api/aws-api/[...path].js
  // req.url will be something like /api/aws-api/auth/login
  // We need to strip /api/aws-api to get /auth/login
  const urlPath = req.url.replace(/^\/api\/aws-api/, '');
  
  const targetUrl = `http://16.171.41.5:8080/api${urlPath}`;

  const options = {
    method: req.method,
    headers: { ...req.headers },
  };

  delete options.headers.host;
  delete options.headers.connection;
  delete options.headers['content-length'];

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (typeof req.body === 'object') {
      options.body = JSON.stringify(req.body);
      options.headers['content-type'] = 'application/json';
    } else {
      options.body = req.body;
    }
  }

  try {
    const response = await fetch(targetUrl, options);
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(502).json({
      success: false,
      message: 'Bad Gateway: Unable to reach AWS backend.',
      error: error.message
    });
  }
}
