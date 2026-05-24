import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as FaIcons from "react-icons/fa";
import { ToastError, ToastSuccess } from "../../../../../tools/Toasting";
import css from "./form.module.css";
import logo from "../../../../../assets/logos/defensa.png";
import { useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { xlogin_true, xset_user } from "../../../../../Redux/slice/usuarioAuthSlice";
import { authLogin } from "../../../../../api/apiAuthLogin";
import { useNavigate } from "react-router";


// Schema de formulario con zod — ahora usa email
export const schema = z.object({
  email: z
    .string()
    .min(1, "Email es obligatorio")
    .email("Email no válido"),

  password: z
    .string()
    .min(1, "Password es obligatorio")
    .min(6, "Mínimo 6 caracteres"),
});

// Component
export default function FormLogin() {
  const [eyePass, setEyePass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // ? LOGIN AUTH — cookie httpOnly ****************************************
  const mutationLogin = useMutation({
    mutationFn: authLogin,

    onSuccess: (data) => {
      // El token ya fue guardado como cookie httpOnly por el servidor
      dispatch(xlogin_true(true));
      dispatch(xset_user(data.user));

      // Invalidar la query de verify para que AuthProvider tenga datos frescos
      queryClient.invalidateQueries({ queryKey: ["auth", "verify"] });

      ToastSuccess("Login exitoso ✔️");
      navigate("/");
    },
    onError: (error) => {
      const msg = error?.response?.data?.msj || "Error al iniciar sesión";
      ToastError(msg);
    },
  });

  // Post data al server
  const onSubmit = (data) => {
    const auth = {
      email: data.email,
      password: data.password,
    };

    mutationLogin.mutate(auth);
  };

  // Mostrar un error personalizado
  const errorHookForm = (err) => {
    if (err) {
      return <span className={css.error_alert}>{err}</span>;
    }
  };

  // Efecto de input label hacia arriba
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
  }, []);

  // Mostrar el eye con el password
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
        <p className={css.sub_title}> Sistema Predictivo </p>
        <p className={css.sub_title} style={{ marginBottom: 5 }}>
          de Filtración de Documental
        </p>
      </div>

      <section className={`${css.section_input}`}>
        <span className={css.icon_login}>
          <FaIcons.FaEnvelope />
        </span>
        <div className="div_input">
          <label className={`${css.label_form} `}>Email</label>
          <input
            autoComplete="off"
            className={`${css.input} ${"input"} `}
            type="email"
            name="email"
            id="email"
            {...register("email")}
          />
          {errorHookForm(errors.email?.message)}
        </div>
      </section>
      <section className={`${css.section_input}`}>
        <span className={css.icon_login}>
          <FaIcons.FaKey />
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
        {watch("email") ? (
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
