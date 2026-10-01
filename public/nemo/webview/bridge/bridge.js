window.addEventListener("message", (event) => {
  // 校验
  const msg = event.data || {};

  if (msg.event === "postMessage") {
    window._dsf.postMessage(msg.type ?? "", msg.payload ?? "");
  } else if (msg.event === "postMessageAsyn") {
    window._dsaf.postMessageAsyn(msg.type ?? "", msg.payload ?? "", (data) => {
      window.parent.postMessage(
        {
          event: "postMessageAsyn",
          type: msg.type ?? "", // 回传 type
          callbackId: msg.callbackId ?? "",
          data,
        },
        "*",
      );
    });
  } else if (msg.event === "dsBridgeCallback") {
    const callback = window[msg.callbackId];
    if (typeof callback !== "function") return;
    const args = Array.isArray(msg.args)
      ? msg.args
      : Object.values(msg.args ?? {});
    callback(...args);
  }
});

window._dsbridge = {
  call: (method, args) => {
    const argsObject = JSON.parse(args);
    console.log(method, args);
    window.parent.postMessage(
      {
        event: "dsBridgeCall",
        method,
        args: argsObject,
        callbackId: argsObject._dscbstub,
      },
      "*",
    );
  },
};
