import "./style.css";
import { NemoBriget } from "./bridge";

const nemoIframe: HTMLIFrameElement | null = document.querySelector(".iframe");
if (nemoIframe) {
  const briget = new NemoBriget(nemoIframe);
  nemoIframe.onload = () => {
    briget.postMessage("INIT_WEBVIEW_DATA", {
      avatar_url: "【用户头像URL】",
      bcm_version: "0.16.2",
      context_menu_with_set_block_visibility: true,
      enable_hide: false,
      is_login: true,
      is_pad: false,
      nickname: "【用户昵称】",
      sidebar_width: 64,
      stage_position: {
        portrait: {
          fullscreen: {
            bottom: 0,
            height: 591,
            left: 0,
            ratio: 0,
            right: 0,
            top: 0,
            width: 369,
          },
          normal: {
            bottom: 0,
            height: 369,
            left: 0,
            ratio: 0,
            right: 0,
            top: 0,
            width: 231,
          },
        },
      },
      toolbox_mode: "normal",
      translucent_block_visible: "translucent",
      user_id: "【用户ID】",
      user_level: 1, // 用户等级
      user_token: "【用户TOKEN】",
      webview_height: 0,
      work_id: "【作品ID】",
    });
    const postMessageAsyn = () => {
      briget.postMessageAsyn("REQUEST_ALL_SAVE_DATA", {}, (_, data) => {
        console.log(data);
      });
    };
    briget.postMessage("SET_THEATRE_VISIBLE", false);
    requestAnimationFrame(postMessageAsyn);
  };
}
