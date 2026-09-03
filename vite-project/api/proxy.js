export default async function handler(req, res) {
  // We will rewrite /aws-api/* to this proxy
  // So req.url will be something like /aws-api/auth/login
  // We need to strip /aws-api so we can append it to the backend URL
  const urlPath = req.url.replace(/^\/aws-api/, '');
  
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
