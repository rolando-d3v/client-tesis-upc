import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as FaIcons from "react-icons/fa";
import { ToastError, ToastSuccess } from "../../../tools/Toasting";
import css from "./form.module.css";
import logo from "../../../assets/logos/defensa.png";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   nivel1_nivel3,
//   personal,
//   login_true,
//   xsistema_role_opciones,
//   xdefault_nivel_3,
//   xdefault_role,
//   xdefault_opciones,
//   xdefault_nivel_1,
//   xselect_nivel1,
// } from "../../../Redux/perSisRolSlice";
import { authLogin } from "../../../api/apiAuthLogin";
import axios from "axios";


//schema de formualrio con zod
export const schema = z.object({
  dni: z
    .string()
    // .min(1, "dni es obligatorio") // ⬅️ opcional si lo quieres obligatorio
    .min(8, "Minimo 8 numeros")
    .max(8, "Maximo 8 numeros"),

  password: z
    .string()
    .min(1, "Password es obligatorio") // ⬅️ equivalente a required
    .min(6, "Minimo 6 letras"),

  cheked: z.boolean().optional(), // ⬅️ en yup no era required
});

//component
export default function FormLogin() {
  // const queryClient = useQueryClient();


  const [eyePass, setEyePass] = useState(false);

  //Redux Dispath
  // const { sistema } = useSelector((state) => state.perSisRolStyle);

  const dispatch = useDispatch();



  const {
    register,
    watch,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { campo: "prueba" },
    resolver: zodResolver(schema),
  });

  // ? LOGIN AUTH ****************************************
  const mutationLogin = useMutation({
    mutationFn: authLogin,

    onSuccess: async (data) => {
      sessionStorage.setItem("TK_ECO", data.token);
     

      dispatch(xlogin_true(true));
      console.log(data);

      const dataPersona = await axios.get(`${API_ECO}/user/role/${data.uuid} `);

      console.log(dataPersona.data);
      console.log(dataPersona.data.role_id);

      dispatch(xroles_user(dataPersona.data.usuario_role));
      dispatch(xpersonal(dataPersona.data));

      toast("Login", {
        className: "my-classname",
        description: "Exitoso",
        duration: 1500,
        position: "top-center",
        style: {
          background: "#000",
          color: "white",
        },
        // icon: <MyIcon />,
      });

   
        navigate("/");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  //post data in server
  const onSubmit = async (data, e) => {
    const pp = Number(data.numero);
    if (pp !== resultNumber) {
      setErrorNum(true);
      return ToastError("Numero de suma Incorrecto ❗");
    }

    const auth = {
      dni: data.dni,
      password: data.password,
      // sistema: 1,
    };

    // console.log(data);
    mutationAuth.mutate(auth);
    e.target.reset();
  };

  // MOSTRAR UN ERROR PERZONALIZADO
  const errorHookForm = (err) => {
    if (err) {
      return <span className={css.error_alert}>{err}</span>;
    }
  };

  //efecto de input label hacia arriba
  useEffect(() => {
    const inputs = document.querySelectorAll(".input");

    function addcl() {
      let parent = this.parentNode.parentNode;
      parent.classList.add(css.focus);
    }
    function remcl() {
      let parent = this.parentNode.parentNode;
      if (this.value === "") {
        parent.classList.remove(css.focus);
      }
    }

    inputs.forEach((input) => {
      input.addEventListener("focus", addcl);
      input.addEventListener("blur", remcl);
    });

    //limitar numero en input de password
    var input = document.getElementById("dni");
    input.addEventListener("input", function () {
      if (this.value.length > 8) this.value = this.value.slice(0, 8);
    });
  }, []);

  //mostara el eye con el password
  const clickEyePassword = () => {
    setEyePass(!eyePass);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={css.form_login}>
      <div className={css.header}>
        <div className={css.content_logo}>
          <div>
            <img className={css.logo} src={logo} alt="logo_die" style={{width:170}} />
          </div>
        </div>
        <p className={css.sub_title}> Sistema de Gestión Documental</p>
        <p className={css.sub_title} style={{ marginBottom: 5 }}>
          "Moche"
        </p>
      </div>

      <section className={`${css.section_input}`}>
        <span className={css.icon_login}>
          <FaIcons.FaUser className="" />
        </span>
        <div className="div_input">
          <label className={`${css.label_form} `}>Dni</label>
          <input
            autoComplete="off"
            className={`${css.input} ${"input"}  ${css.input_numero} `}
            type="number"
            name="dni"
            id="dni"
            {...register("dni")}
          />
          {errorHookForm(errors.dni?.message)}
        </div>
      </section>
      <section className={`${css.section_input}`}>
        <span className={css.icon_login}>
          <FaIcons.FaKey className="" />
        </span>
        <div className="control-input">
          <label htmlFor="password" className={`${css.label_form} `}>
            Contraseña
          </label>
          <input
            autoComplete="off"
            type={eyePass ? "text" : "password"}
            name="password"
            id="password"
            className={`${css.input} ${"input"} `}
            {...register("password")}
          />
          {watch("password") && (
            <span className={css.eye_pass} onClick={() => clickEyePassword()}>
              {eyePass ? <FaIcons.FaEye /> : <FaIcons.FaEyeSlash />}
            </span>
          )}

          {errorHookForm(errors.password?.message)}
        </div>
      </section>
    
      <div className={css.wrapper_button}>
        {watch("dni") ? (
          <button type="submit" className={`${css.__login}  ${css.__checked} `}>
            Iniciar Sesión
          </button>
        ) : (
          <button className={css.__login} disabled>
            Iniciar Sesión
          </button>
        )}
      </div>
    </form>
  );
}
