const { ForbiddenError } = require('../utils/errors');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized`));
    }
    next();
  };
}

module.exports = { authorize };
