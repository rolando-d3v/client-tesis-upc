import React, { useState } from "react";
// import Particles from "react-particles-js";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

function Fondo() {
  // const [anchodeScream, setAnchodeScream] = useState(40);

  // let particula = "#fff";

  // window.addEventListener("resize", function () {
  //   let ancho = window.innerWidth;
  //   if (ancho < 750) {
  //     setAnchodeScream(20);
  //     // console.log("hola 640");
  //   }
  // });
  // console.log(anchodeScream);


  // const particlesLoaded = useCallback(async (container) => {
  //   // await console.log(container);
  // }, []);

  // const [count, setCount] = useState(50);

  const init = useCallback(async (engine) => {
    await loadFull(engine);
  });

  return (
    <div
      style={{
        // position: "fixed",
        width: "100%",
        height: "100%",
        // backgroundImage:
        //   "url(https://res.cloudinary.com/perusap/image/upload/v1646101446/EXAM/fondo_fondo_uydhq8.jpg)",
     
        // backgroundRepeat: "no-repeat",
        // backgroundSize: "cover",
        // backgroundPosition: "center",
      }}
    >
      <Particles
        id="tsparticles"
        // init={particlesInit}
        // loaded={particlesLoaded}
        options={{
          particles: {
            color: {
              value: "#fff",
            },
            number: {
              value: 50,
            },
            opacity: {
              value: { min: 0.3, max: 1 },
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 5 },
            },
            move: {
              // direction: "bottom",
              // direction: "bottom-right",
              direction: "bottom-left",
              enable: true,
              speed: { min: 3, max: 5 },
              straight: true,
            },
          },
        }}
        init={init}

        // options={{
        //   background: {
        //     color: {
        //       value: "#0d47a1",
        //     },
        //     opacity: 0.2,
        //   },
        //   fpsLimit: 120,
        //   interactivity: {
        //     events: {
        //       onClick: {
        //         enable: true,
        //         mode: "push",
        //       },
        //       onHover: {
        //         enable: true,
        //         mode: "repulse",
        //       },
        //       resize: true,
        //     },
        //     modes: {
        //       push: {
        //         quantity: 4,
        //       },
        //       repulse: {
        //         distance: 200,
        //         duration: 0.4,
        //       },
        //     },
        //   },
        //   particles: {
        //     color: {
        //       value: "#ffffff",
        //     },
        //     links: {
        //       color: "#ffffff",
        //       distance: 150,
        //       enable: true,
        //       opacity: 0.5,
        //       width: 1,
        //     },
        //     collisions: {
        //       enable: true,
        //     },
        //     move: {
        //       directions: "none",
        //       enable: true,
        //       outModes: {
        //         default: "bounce",
        //       },
        //       random: false,
        //       speed: 2,
        //       straight: false,
        //     },
        //     number: {
        //       density: {
        //         enable: true,
        //         area: 800,
        //       },
        //       value: anchodeScream,
        //     },
        //     opacity: {
        //       value: 0.5,
        //     },
        //     shape: {
        //       type: "circle",
        //     },
        //     size: {
        //       value: { min: 1, max: 5 },
        //     },
        //   },
        //   detectRetina: true,
        // }}
      />
    </div>

  );
}

export default Fondo;
