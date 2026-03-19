import React from "react";
import css from "./footer.module.css";
// import * as FaIcons from "react-icons/fa";
import { Link } from "react-router";

export default function FooterLogin() {

  const year_actual = new Date().getFullYear();

  return (
    <div className={css.footer}>
      <section>
        <div className={css.content_title}>
          
            <span className={css.text}>
              Dirección de Inteligencia del Ejército
            </span>
            {/* <FaIcons.FaMedapps className={css.icon} /> */}
         
        </div>

        <div className={css.content_text}>
          <h5 className={`${css.text_2}  ${css.version} `}>
            Departamento de Tecnologías para Inteligencia {year_actual}
          </h5>
        </div>
      </section>
    </div>
  );
}
