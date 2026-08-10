import { homographyFromQuad, invertHomography } from "./geometry.js";

const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_background;
uniform sampler2D u_overlay;
uniform mat3 u_inverseHomography;
uniform float u_overlayOpacity;
uniform int u_blendMode;

vec3 blend(vec3 base, vec3 top) {
  if (u_blendMode == 1) return base * top;
  if (u_blendMode == 2) return 1.0 - (1.0 - base) * (1.0 - top);
  if (u_blendMode == 3) return abs(base - top);
  return top;
}

void main() {
  vec2 screenPoint = vec2(v_uv.x, 1.0 - v_uv.y);
  vec4 background = texture2D(u_background, screenPoint);
  vec3 projected = u_inverseHomography * vec3(screenPoint, 1.0);
  vec2 uv = projected.xy / projected.z;
  bool inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  vec4 overlay = inside ? texture2D(u_overlay, uv) : vec4(0.0);
  float alpha = overlay.a * u_overlayOpacity;
  vec3 composed = mix(background.rgb, blend(background.rgb, overlay.rgb), alpha);
  gl_FragColor = vec4(composed, 1.0);
}`;

export class ProjectionRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.background = null;
    this.overlay = null;
    this.quad = null;
    this.opacity = 0.72;
    this.blendMode = "normal";
    this.animation = 0;
    this.animationKind = null;
    this.backgroundDirty = true;
    this.overlayDirty = true;
    this.#initialize();
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.stop();
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.#initialize();
      this.start();
    });
  }

  setBackground(source) {
    this.background = source;
    this.backgroundDirty = true;
    this.render();
  }

  setOverlay(source) {
    this.overlay = source;
    this.overlayDirty = true;
    this.render();
  }

  setProjection(quad, opacity = this.opacity, blendMode = this.blendMode) {
    this.quad = quad;
    this.opacity = opacity;
    this.blendMode = blendMode;
    this.render();
  }

  resize() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * scale));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  start() {
    if (this.animation) return;
    const frame = () => {
      this.animation = 0;
      this.render();
      this.#scheduleFrame(frame);
    };
    this.#scheduleFrame(frame);
  }

  stop() {
    if (this.animationKind === "video" && typeof this.background?.cancelVideoFrameCallback === "function") {
      this.background.cancelVideoFrameCallback(this.animation);
    } else {
      cancelAnimationFrame(this.animation);
    }
    this.animation = 0;
    this.animationKind = null;
  }

  render() {
    if (!this.gl) return;
    this.resize();
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    if (this.backgroundDirty || this.background instanceof HTMLVideoElement) {
      uploadTexture(gl, this.backgroundTexture, this.background, [29, 31, 30, 255]);
      this.backgroundDirty = false;
    }
    if (this.overlayDirty) {
      uploadTexture(gl, this.overlayTexture, this.overlay, [0, 0, 0, 0]);
      this.overlayDirty = false;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.overlayTexture);
    const quad = this.quad ?? [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    let inverse = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    let opacity = this.opacity;
    try {
      inverse = invertHomography(homographyFromQuad(quad));
    } catch {
      opacity = 0;
    }
    gl.uniformMatrix3fv(this.uniforms.inverse, false, transpose3(inverse));
    gl.uniform1f(this.uniforms.opacity, opacity);
    gl.uniform1i(this.uniforms.blend, ["normal", "multiply", "screen", "difference"].indexOf(this.blendMode));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  #scheduleFrame(callback) {
    if (this.background instanceof HTMLVideoElement && typeof this.background.requestVideoFrameCallback === "function") {
      this.animationKind = "video";
      this.animation = this.background.requestVideoFrameCallback(callback);
    } else {
      this.animationKind = "animation";
      this.animation = requestAnimationFrame(callback);
    }
  }

  #initialize() {
    const gl = this.canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) throw new Error("WebGL is not supported by this browser");
    this.gl = gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    gl.useProgram(this.program);
    const position = gl.getAttribLocation(this.program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.backgroundTexture = createTexture(gl);
    this.overlayTexture = createTexture(gl);
    this.backgroundDirty = true;
    this.overlayDirty = true;
    gl.uniform1i(gl.getUniformLocation(this.program, "u_background"), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_overlay"), 1);
    this.uniforms = {
      inverse: gl.getUniformLocation(this.program, "u_inverseHomography"),
      opacity: gl.getUniformLocation(this.program, "u_overlayOpacity"),
      blend: gl.getUniformLocation(this.program, "u_blendMode"),
    };
  }
}

function createProgram(gl, vertex, fragment) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function uploadTexture(gl, texture, source, fallback) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (source && (!(source instanceof HTMLVideoElement) || source.readyState >= 2)) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(fallback));
  }
}

function transpose3(matrix) {
  return new Float32Array([matrix[0], matrix[3], matrix[6], matrix[1], matrix[4], matrix[7], matrix[2], matrix[5], matrix[8]]);
}