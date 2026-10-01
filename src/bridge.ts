export class NemoBriget {
  private nemoIframe: HTMLIFrameElement;
  private callbackId: number = 0;
  constructor(iframe: HTMLIFrameElement) {
    this.nemoIframe = iframe;
  }
  postMessage(type: string, payload: unknown) {
    if (!this.nemoIframe.contentWindow) return;
    this.nemoIframe.contentWindow.postMessage({
      event: "postMessage",
      type,
      payload,
    });
  }
  postMessageAsyn(
    type: string,
    payload: unknown,
    callback?: (err: Error | null, data?: unknown) => void,
    timeout = 10000,
  ): Promise<unknown> | void {
    if (!this.nemoIframe.contentWindow) {
      const err = new Error("iframe contentWindow 不存在");
      if (callback) {
        callback(err);
        return;
      }
      return Promise.reject(err);
    }

    const callbackId = `id-${this.callbackId}`;
    this.callbackId += 1;

    // 向外发送消息
    this.nemoIframe.contentWindow.postMessage({
      event: "postMessageAsyn",
      type,
      payload,
      callbackId,
    });

    const promise = new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;

      const messageCallback = (event: MessageEvent) => {
        const msg = event.data || {};
        if (
          msg.callbackId === callbackId &&
          msg.event === "postMessageAsyn" &&
          msg.type === type
        ) {
          clearTimeout(timer);
          window.removeEventListener("message", messageCallback);
          resolve(msg.data);
        }
      };

      window.addEventListener("message", messageCallback);

      timer = setTimeout(() => {
        window.removeEventListener("message", messageCallback);
        reject(
          new Error(`postMessageAsyn timeout: ${timeout}ms, type:${type}`),
        );
      }, timeout);
    });

    if (typeof callback === "function") {
      promise
        .then((data) => callback(null, data))
        .catch((err) => callback(err));
      return undefined;
    }

    return promise;
  }

  registerDsBridgeCallback(callback: (args: unknown, method: unknown) => void) {
    let currentCallbackId = "";

    const dsBridgeCallback = (event: MessageEvent) => {
      const msg = event.data || {};
      if (msg.event === "dsBridgeCallback") {
        currentCallbackId = msg.callbackId;
        window.removeEventListener("message", dsBridgeCallback);

        const callbackReturn = callback(msg.args, msg.method);
        if (callbackReturn !== undefined && this.nemoIframe.contentWindow) {
          this.nemoIframe.contentWindow.postMessage({
            event: "dsBridgeCallback",
            args: callbackReturn,
            callbackId: currentCallbackId,
          });
        }
      }
    };

    window.addEventListener("message", dsBridgeCallback);
  }
}
