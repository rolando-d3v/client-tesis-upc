export const colorStyles = {
  control: (base, state) => ({
    ...base,
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#fff",
    // borderColor: state.isFocused ? "#424242" : "#202225",
    borderColor: state.isFocused ? "grey" : "grey",
    boxShadow: state.isFocused ? null : null,
    "&:hover": {
      background: "#ff4b13",
      borderColor: state.isFocused ? "grey" : "grey",
    },
  }),

  placeholder: (styles) => ({
    ...styles,
    color: "#fff",
  }),

  input: (styles) => ({
    ...styles,
    color: "#fff",
    fontSize: 13,
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    color: "#fff",
  }),

  singleValue: (styles, base, state) => ({
    ...base,
    ...styles,
    padding: 2,
    borderRadius: 4,
    fontWeight: 500,
    color: "#fff",
    display: "flex",
    fontSize: 13,
  }),

  clearIndicator: (styles) => ({
    ...styles,
    color: "#fff",
  }),
  indicatorSeparator: (defaultStyles) => {
    return {
      ...defaultStyles,
      color: "#fff",
    };
  },

  option: (provided, state) => ({
    ...provided,
    borderBottom: "1px solid #eee",
    color: state.isSelected ? "red" : "#000",
    background: "#fffff",
    fontSize: 13,

    background: state.isSelected ? "#ccc" : "transparent",
    color: state.isSelected ? "red" : "#000",
    cursor: "pointer",
    "&:hover": {
      background: state.isSelected ? "#766ac8" : "#c2e7ff",
      color: state.isSelected ? "#fff" : "#000",
    },
  }),

  menuList: (styles) => ({
    ...styles,
    background: "#fff",
    border: "1px solid",
    borderRadius: 6,

    "::-webkit-scrollbar": {
      width: "4px",
      height: "4px",
    },
    "::-webkit-scrollbar-track": {
      background: "#000",
    },
    "::-webkit-scrollbar-thumb": {
      background: "#888",
      borderRadius: "25px",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: "#555",
    },
  }),
};
