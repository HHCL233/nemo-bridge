export class NemoBriget {
  private nemoIframe: HTMLIFrameElement;
  private callbackId: number = 0;
  private targetOrigin: string;

  constructor(iframe: HTMLIFrameElement, targetOrigin = "*") {
    this.nemoIframe = iframe;
    this.targetOrigin = targetOrigin;
  }

  private get contentWindow() {
    return this.nemoIframe.contentWindow;
  }

  postMessage(type: string, payload: unknown) {
    const cw = this.contentWindow;
    if (!cw) return;
    cw.postMessage({ event: "postMessage", type, payload }, this.targetOrigin);
  }

  postMessageAsyn(
    type: string,
    payload: unknown,
    callback?: (err: Error | null, data?: unknown) => void,
    timeout = 10000,
  ): Promise<unknown> | void {
    const cw = this.contentWindow;
    if (!cw) {
      const err = new Error("iframe contentWindow 不存在");
      if (callback) {
        callback(err);
        return;
      }
      return Promise.reject(err);
    }

    const callbackId = `id-${this.callbackId++}`;

    const promise = new Promise<unknown>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;

      const messageCallback = (event: MessageEvent) => {
        // 校验来源,避免被其他窗口伪造
        if (event.source !== cw) return;
        const msg = event.data || {};
        if (msg.event === "postMessageAsyn" && msg.callbackId === callbackId) {
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

      cw.postMessage(
        { event: "postMessageAsyn", type, payload, callbackId },
        this.targetOrigin,
      );
    });

    if (typeof callback === "function") {
      promise
        .then((data) => callback(null, data))
        .catch((err) => callback(err));
      return undefined;
    }

    return promise;
  }

  /**
   * 注册dsBridge调用处理器
   */
  registerDsBridgeCallback(
    callback: (args: unknown, method: unknown) => unknown,
  ): () => void {
    const handler = (event: MessageEvent) => {
      const cw = this.contentWindow;
      if (!cw || event.source !== cw) return;
      const msg = event.data || {};

      // 与iframe端发送的事件名保持一致
      if (msg.event !== "dsBridgeCall") return;

      const result = callback(msg.args, msg.method);

      if (result !== undefined) {
        cw.postMessage(
          {
            event: "dsBridgeCallback",
            // 统一包装成数组，避免 iframe 端 Object.values 顺序不确定
            args: Array.isArray(result) ? result : [result],
            callbackId: msg.callbackId,
          },
          this.targetOrigin,
        );
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }
}
