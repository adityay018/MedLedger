// Global error handler middleware with Oracle error translation
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Oracle specific error mapping
  if (err.message) {
    if (err.message.includes('ORA-02292')) {
      statusCode = 409;
      message = 'Cannot delete or modify record: Dependent child records exist in other tables. Referential integrity preserved.';
    } else if (err.message.includes('ORA-00001')) {
      statusCode = 409;
      message = 'Unique constraint violation: A record with this identifier or unique value (e.g. QR code or license) already exists.';
    } else if (err.message.includes('ORA-02291')) {
      statusCode = 400;
      message = 'Foreign key violation: The referenced parent entity does not exist in the database.';
    } else if (err.message.includes('ORA-02290')) {
      statusCode = 400;
      message = 'Database check constraint violation: Provided values do not meet allowable business rules or lifecycle statuses.';
    } else if (err.message.includes('ORA-01400')) {
      statusCode = 400;
      message = 'Mandatory field missing: Cannot insert NULL into a required database column.';
    } else if (/ORA-20\d{3}/.test(err.message) || (typeof err.code === 'number' && err.code < 0)) {
      statusCode = 400;
      // Extract custom PL/SQL application error message
      const match = err.message.match(/ORA-20\d{3}:\s*([^(\n\r]+)/);
      if (match && match[1]) {
        message = match[1].trim();
      }
    } else if (err.message.includes('NJS-') || err.message.includes('ORA-12541') || err.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      message = 'Oracle database service is temporarily unreachable.';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || null
  });
}

module.exports = errorHandler;

