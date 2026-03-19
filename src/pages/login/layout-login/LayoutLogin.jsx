import { useEffect} from "react";
import { motion } from "motion/react";
// import FooterLogin from "../footer-login/FooterLogin";
import FormLogin from "../form-login/FormLogin";
import css from "./layout.module.css";




export default function LayoutLogin() {
  
  const item1 = {
    hidden: { opacity: 0, x: -400 },
    visible: { opacity: 1, x: 0 },
  };
  const item2 = {
    hidden: { opacity: 0, x: -800 },
    visible: { opacity: 1, x: 0 },
  };
  const item3 = {
    hidden: { opacity: 0, x: -1500 },
    visible: { opacity: 1, x: 0 },
  };


  const item10 = {
    hidden: { opacity: 0, x: -400 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div
      className={css.wrapper_screen}
      // style={{
      //   backgroundImage:
      //     "url(/backgroung/bolog.jpg)",
      // }}
    >
      <motion.div
        className={css.content_form}
        variants={item10}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {/* <ButtonHead /> */}
        <FormLogin />
        {/* <FooterLogin /> */}
      </motion.div>

    

      <div className={css.div_text}>
        <h1 className={css.content_text}>
          <motion.span
            variants={item1}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1, duration: 1 }}
          >
            Sistema de Gestión
          </motion.span>
          <motion.span
            variants={item2}
            initial="hidden"
            animate="visible"
            transition={{ delay: 2, duration: 1 }}
          >
            Documental
          </motion.span>
          <motion.span
            variants={item3}
            initial="hidden"
            animate="visible"
            transition={{ delay: 3, duration: 1 }}
          >
            "Moche"
          </motion.span>
        </h1>
      </div>

      <video
        className={css.video}
        preload="auto"
        muted
        loop
        playsInline
        src="videoBg2.mp4"
        // src="City.mp4"
        // src="login.mp4"
        type="video/mp4"
        autoPlay
      ></video>
     
    </div>
  );
}
