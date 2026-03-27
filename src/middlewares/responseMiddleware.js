// middlewares/response.js
const responseMiddleware = (req, res, next) => {
  // success response (keeps data + any extra fields like meta)
  
  res.apiResponse = (payload = {}) => {
    const {
      success = true,
      status = 200,
      data = null,
      message = null,
      headers,
      ...rest // <-- meta, pagination, anything else
    } = payload || {};

    const st = Number.isInteger(status) ? status : 200;

    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        if (v !== undefined) res.setHeader(k, v);
      }
    }

    return res.status(st).json({
      success,
      status: st,
      data,
      message,
      ...rest, // e.g. meta
    });
  };

  // error response (NO data)
  res.apiError = (payload = {}) => {
    const {
      status = 400,
      message = 'Something went wrong',
      headers,
      ...rest // optional extras like code, errors, etc. (still no data)
    } = payload || {};

    const st = Number.isInteger(status) ? status : 400;

    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers)) {
        if (v !== undefined) res.setHeader(k, v);
      }
    }

    return res.status(st).json({
      success: false,
      status: st,
      message,
      ...rest,
    });
  };

  next();
};

module.exports = responseMiddleware;
