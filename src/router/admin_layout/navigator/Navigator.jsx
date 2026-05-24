import  { useState } from "react";
import css from "./Navigator.module.css";
import logo from "../../../assets/logos/defensa.png";
import * as FaIcons from "react-icons/fa6";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";

// import { useAllSeccion } from "../../../api_ecommerce/apiSeccion";

const ROUTES = [
  { id: 1, name: "MUEBLES", url: "/muebles" },
  { id: 2, name: "NOSOTROS", url: "/nosotros" },
];

export default function Navigator() {
  const [colorBg, setColorBg] = useState(false);
  const [color, setColor] = useState(false);

  // const changeColor = () => {
  //   if (window.scrollY >= 60) {
  //     setColorBg(true);
  //   } else {
  //     setColorBg(false);
  //   }
  // };

  // window.addEventListener("scroll", changeColor);

  // const { auth, roles_user } = useSelector((state) => state.USER_AUTH);
  // const { list } = useSelector((state) => state.CART_APP);
  // const dispatch = useDispatch();

  // const ALL_SECCION = useAllSeccion();

  return (
    <header
      className={`
      ${colorBg === true && css.header_bg_scroll}
      ${color === true && css.header_position}       ${css.header}`}
    >
      <div className={css.content_header}>
        <nav className={css.navigation_logo}>
          <Link to="/" className={css.link_img}>
            <img src={logo} alt="logo" />
          </Link>
        </nav>

        <nav className={css.navigation03}>
        
     
          <Link to="/user/tabla" className={css.link_item_carrito}>
            <FaIcons.FaCartShopping className={css.icon_item} />
        
          </Link>

          <Link to="/user" className={css.link_item_icon}>
            {/* <Link to="/user/pagos" className={css.link_item}> */}
            <FaIcons.FaPaypal className={css.icon_item} />
          </Link>
        </nav>
        <nav className={css.navigation03}>
          <FaIcons.FaMagnifyingGlass className={css.icon_item} />
        </nav>
      </div>
    </header>
  );
}
