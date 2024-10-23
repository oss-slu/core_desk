import mitt from "mitt";
export const emitter = mitt();

window.emitter = emitter;
