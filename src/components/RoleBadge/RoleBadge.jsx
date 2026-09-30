import React from "react";
import styles from "./RoleBadge.module.css";
import {
  FaCrown,
  FaUserTie,
  FaShieldHalved,
  FaEnvelope,
  FaUser,
} from "react-icons/fa6";

const ROLE_CONFIG = {
  EJECUTIVO: {
    label: "EJECUTIVO",
    styleClass: styles.roleEjecutivo,
    Icon: FaCrown,
    title: "Rol Ejecutivo (Autorizado para documentos clasificados y envío exterior)",
  },
  JEFE_SD_DPT: {
    label: "JEFE SD/DPT",
    styleClass: styles.roleJefeSdDpt,
    Icon: FaUserTie,
    title: "Jefe Subdirección / Departamento (Autorizado para trámite clasificado)",
  },
  JEFE_UU: {
    label: "JEFE UU",
    styleClass: styles.roleJefeUu,
    Icon: FaShieldHalved,
    title: "Jefe de Unidad (Gestión interna de dependencia)",
  },
  "CENTRO DE MENSAJES": {
    label: "CENTRO MENSAJES",
    styleClass: styles.roleCentroMensajes,
    Icon: FaEnvelope,
    title: "Centro de Mensajes (Despacho oficial 24h a nivel institucional)",
  },
  USER: {
    label: "USER",
    styleClass: styles.roleUser,
    Icon: FaUser,
    title: "Usuario Estándar (Restricción horaria 08:00-16:00 y destino exterior)",
  },
  "USER 2": {
    label: "USER 2",
    styleClass: styles.roleUser,
    Icon: FaUser,
    title: "Usuario Estándar Secundario",
  },
};

export default function RoleBadge({
  role = "USER",
  size = "small",
  showIcon = true,
  className = "",
  showTooltip = true,
}) {
  const normalized = String(role || "USER").trim().toUpperCase();
  const config =
    ROLE_CONFIG[normalized] || {
      label: normalized || "USER",
      styleClass: styles.roleUser,
      Icon: FaUser,
      title: `Rol: ${normalized || "USER"}`,
    };

  const sizeClass =
    size === "large"
      ? styles.sizeLarge
      : size === "medium"
      ? styles.sizeMedium
      : styles.sizeSmall;

  const { Icon, label, styleClass, title } = config;

  return (
    <span
      className={`${styles.badge} ${styleClass} ${sizeClass} ${className}`}
      title={showTooltip ? title : undefined}
    >
      {showIcon && Icon && (
        <span className={styles.icon}>
          <Icon />
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}
