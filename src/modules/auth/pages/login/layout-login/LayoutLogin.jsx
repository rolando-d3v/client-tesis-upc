import { motion } from "motion/react";
import FooterLogin from "../footer-login/FooterLogin";
import FormLogin from "../form-login/FormLogin";
import css from "./layout.module.css";


export default function LayoutLogin() {
  const item1 = {
    hidden: { opacity: 0, x: -150 },
    visible: { opacity: 1, x: 0 },
  };
  const item2 = {
    hidden: { opacity: 0, x: -150 },
    visible: { opacity: 1, x: 0 },
  };
  const item3 = {
    hidden: { opacity: 0, x: -150 },
    visible: { opacity: 1, x: 0 },
  };

  const item10 = {
    hidden: { opacity: 0, x: -400 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className={css.wrapper_screen}>
      <motion.div
        className={css.content_form}
        variants={item10}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <FormLogin />
        <FooterLogin />
      </motion.div>

      <div className={css.div_text}>
        <h1 className={css.content_text}>
          <motion.span
            variants={item1}
            className={css.text_span}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.8, duration: 0.8 }}
            >
            Sistema Predictivo
          </motion.span>
          <motion.span
            className={css.text_span}
            variants={item2}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.1, duration: 0.8 }}
            >
            de Filtración
          </motion.span>
          <motion.span
            className={css.text_span}
            variants={item3}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            Documental
          </motion.span>
        </h1>
      </div>

      <img
        className={css.background_image}
        src="leak_prediction_bg.png"
        alt="Sistema de Predicción de Filtración de Documentación Confidencial"
      />
    </div>
  );
}
