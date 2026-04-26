const Module = require('module');

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function loadModule(modulePath, mocks = {}) {
  clearModule(modulePath);

  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }

    try {
      const resolved = Module._resolveFilename(request, parent, isMain);
      if (Object.prototype.hasOwnProperty.call(mocks, resolved)) {
        return mocks[resolved];
      }
    } catch (err) {
      // Ignore resolution failures here and let Node handle them normally.
    }

    return originalLoad(request, parent, isMain);
  };

  try {
    return require(modulePath);
  } finally {
    Module._load = originalLoad;
  }
}

module.exports = { clearModule, loadModule };
