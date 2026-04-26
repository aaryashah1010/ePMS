function createSpy(impl = () => undefined) {
  const spy = (...args) => {
    spy.calls.push(args);
    return impl(...args);
  };

  spy.calls = [];
  spy.setImpl = (nextImpl) => {
    impl = nextImpl;
  };

  return spy;
}

function createAsyncSpy(impl = async () => undefined) {
  const spy = async (...args) => {
    spy.calls.push(args);
    return impl(...args);
  };

  spy.calls = [];
  spy.setImpl = (nextImpl) => {
    impl = nextImpl;
  };

  return spy;
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end() {
      this.ended = true;
    },
  };
}

function getRouteDescriptors(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
      handlers: layer.route.stack.map((stackItem) => stackItem.handle),
    }));
}

module.exports = {
  createSpy,
  createAsyncSpy,
  createRes,
  getRouteDescriptors,
};
