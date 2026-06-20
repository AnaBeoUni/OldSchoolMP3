import { useEffect, useRef } from 'react';

const LiquidGlassBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    const vertexShaderSrc = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = vec2(a_position.x, -a_position.y) * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSrc = `
      precision mediump float;
      uniform float u_dpr;
      uniform vec2 u_resolution;
      uniform float u_time;
      varying vec2 v_uv;

      float roundedBox(vec2 uv, vec2 center, vec2 size, float radius) {
        vec2 q = abs(uv - center) - size + radius;
        return length(max(q, 0.0)) - radius;
      }

      float glassBubble(vec2 pixelUV, vec2 center, vec2 size) {
        float radius = 20.0;
        float dist = roundedBox(pixelUV, center, size, radius);
        if (dist > 1.0) return 0.0;
        float edge = 1.0 - smoothstep(0.0, 0.03, dist * -2.0);
        float edgeFalloff = smoothstep(0.01, 0.0, dist);
        return mix(0.3, 0.7, edge) * edgeFalloff;
      }

      void main() {
        vec2 pixelUV = (v_uv * u_resolution) / u_dpr;
        vec3 color = vec3(0.0);
        float totalAlpha = 0.0;
        
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float time = u_time + fi * 0.5;
          vec2 pos = vec2(
            sin(time * 0.5 + fi) * u_resolution.x * 0.3 + u_resolution.x * 0.5,
            cos(time * 0.3 + fi * 1.5) * u_resolution.y * 0.3 + u_resolution.y * 0.5
          );
          float scale = 0.7 + 0.3 * sin(time * 0.7 + fi);
          vec2 size = vec2(100.0 * scale, 70.0 * scale);
          vec3 bubbleColor = vec3(
            0.5 + 0.5 * sin(fi + time * 0.3),
            0.6 + 0.4 * cos(fi * 2.0 + time * 0.2),
            0.9 + 0.1 * sin(fi * 3.0 - time * 0.25)
          );
          float alpha = glassBubble(pixelUV, pos, size);
          color += bubbleColor * alpha;
          totalAlpha += alpha;
        }
        
        if (totalAlpha > 0.0) color /= totalAlpha;
        gl_FragColor = vec4(color, totalAlpha * 0.6);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const u_resolution = gl.getUniformLocation(program, 'u_resolution');
    const u_time = gl.getUniformLocation(program, 'u_time');
    const u_dpr = gl.getUniformLocation(program, 'u_dpr');
    gl.uniform1f(u_dpr, window.devicePixelRatio || 1);

    let startTime = performance.now();

    const draw = (now) => {
      const elapsed = (now - startTime) / 1000;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.uniform1f(u_time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
  );
};

export default LiquidGlassBackground;
