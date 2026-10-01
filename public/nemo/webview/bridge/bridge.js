window.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.event === "postMessage") {
    window._dsf.postMessage(msg.type ?? "", msg.payload ?? "");
  } else if (msg.event === "postMessageAsyn") {
    console.log(msg);
    window._dsaf.postMessageAsyn(msg.type ?? "", msg.payload ?? "", (data) => {
      window.parent.postMessage({
        event: "postMessageAsyn",
        callbackId: msg.callbackId ?? "",
        data: data,
      });
    });
  } else if (msg.event === "dsBridgeCallback") {
    const callback = window[msg.callbackId];
    if (Array.isArray(msg.args)) {
      callback(...msg.args);
    } else {
      callback(...Object.values(msg.args));
    }
  }
});

window._dsbridge = {
  call: (method, args) => {
    const argsObject = JSON.parse(args);
    console.log(method, args);
    window.parent.postMessage({
      event: "dsBridgeCall",
      method: method,
      args: argsObject,
      callbackId: argsObject._dscbstub,
    });
  },
};
