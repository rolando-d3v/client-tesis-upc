import React, { useEffect } from "react";
import { Link } from "react-router";
// import pepe from "../../assets/logo/logo_eco23.png";
import css from "./list_seccion.module.css";

export default function ListaSeccion({ ALL_SECCION }) {
  useEffect(() => {
    const profile = document.querySelector(`.${css.profile}`);
    const dropdown = document.querySelector(`.${css.dropdown__wrapper}`);

    profile.addEventListener("click", () => {
      dropdown.classList.remove(`${css.none}`);
      dropdown.classList.toggle(`${css.hide}`);
    });

    document.addEventListener("click", (event) => {
      const isClickInsideDropdown = dropdown.contains(event.target);
      const isProfileClicked = profile.contains(event.target);

      if (!isClickInsideDropdown && !isProfileClicked) {
        dropdown.classList.add(`${css.hide}`);
        dropdown.classList.add(`${css.dropdown__wrapper__fade_in}`);
      }
    });
  }, []);

  const setClicked = () => {
    const dropdown = document.querySelector(`.${css.dropdown__wrapper}`);
    dropdown.classList.remove(`${css.none}`);
    dropdown.classList.toggle(`${css.hide}`);
  };

  return (
    <div className={css.dropdown}>
      <div className={css.navigation__group}>
        <h5 className={css.profile}  >
          Selecciona
        </h5>
      </div>

      <div
        className={`${css.dropdown__wrapper}
         ${css.dropdown__wrapper__fade_in}
         ${css.hide} 
         ${css.none} `}
      >
        <div className={css.dropdown__group}>
          <div className="user-name">Joe Doe</div>
        </div>

        <nav>
          <hr className="divider" />
          <ul>
            {ALL_SECCION.data?.map((drop, index) => {
              return (
                <Link
                  className={`${drop?.url_seccion_v} ${css.link_item} `}
                  onClick={() => setClicked()}
                  key={index}
                  to={  `/seccion/${drop?.url_seccion_v}`}
                >
                  <span>{drop?.name_small_v}</span>
                </Link>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import css from "./list_seccion.module.scss";

// export default function ListaSeccion({ ALL_SECCION }) {

//   const [clicked, setClicked] = useState(null);

//   return (
//     <div className={css.dropdown_item1}>
//       <div
//         className={css.div_text}
//         onClick={() => {
//           setClicked(!clicked);
//         }}
//       >
//         <span className={css.name}>Selecciona</span>
//       </div>

//       {clicked === true && (
//         <div className={css.dropx}>
//           {ALL_SECCION.data?.map((drop, index) => {
//             return (
//               <Link
//                 className={`${css.link_item}
//                         `}
//                 key={index}
//                 to={drop?.url_seccion_v || "No_tiene_ruta_esta_opcion"}
//                 onClick={() => {
//                   setClicked(false);
//                 }}
//               >
//                 <span>{drop?.name_small_v}</span>
//               </Link>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// import React from "react";
// // import x from "./list_seccion.module.scss";
// import Select from "react-select";
// import { colorStyles } from "./style_select";

// export default function ListaSeccion({ ALL_SECCION }) {
//   const arrayAllClasificacion = ALL_SECCION.data?.map((e) => {
//     return { value: e.id_seccion_i, label: e.name_small_v.charAt(0).toUpperCase() + e.name_small_v.slice(1)  };
//   });

//   return (
//     <div>
//       <Select

//        className="basic-single"
//         classNamePrefix="select"
//         // className={css.selecciona}
//         // isMulti
//         isClearable={true}
//         // isClearable={isClearable}
//         name="colors"
//         styles={colorStyles}
//         options={arrayAllClasificacion}
//         // className="basic-multi-select"

//         placeholder="Selecciona seccion"
//         // value={dataNivel4Select}
//         // onChange={obtenerNivel4SelectUser}
//       />
//     </div>
//   );
// }
