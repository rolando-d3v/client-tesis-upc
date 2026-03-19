import React, { useRef } from "react";
import css from "./button.module.scss";
// import * as FaIcons from "react-icons/fa";
import { Player } from "@lottiefiles/react-lottie-player";

export default function ButtonHead() {
  const user_icon = useRef(null);

  const iconUser = () => user_icon.current.play();

  return (
    <div className={css.button_head} onMouseOver={iconUser}>
      <Player
        // src="https://cdn.lordicon.com/dxjqoygy.json"
        // src="https://cdn.lordicon.com/dqxvvqzi.json"
        src="https://cdn.lordicon.com/ljvjsnvh.json"
        autoplay
        className={css.icon_user_json}
        ref={user_icon}
      />
      <span className={css.text_button}>Login</span>
    </div>
  );
}
