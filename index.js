const canvasEl = document.querySelector("#gooey-overlay");
const contentEl = document.querySelector(".text-overlay");
const scrollMsgEl = document.querySelector(".scroll-msg");
const scrollArrowEl = document.querySelector(".arrow-animated-wrapper");

const devicePixelRatio = Math.min(window.devicePixelRatio, 2);

// HARD-CODED VALUES
const params = {
    scrollProgress: 0,
    colWidth: 0.7,
    speed: 0.2,
    scale: 0.25,
    seed: 0.231,
    color: [0.4, 0.2, 0.8],
    pageColor: "#0f0c1a"
};

let st, uniforms;
const gl = initShader();

//  SET PAGE COLOR DIRECTLY
document.body.style.backgroundColor = params.pageColor;

st = gsap.timeline({
    scrollTrigger: {
        trigger: ".page",
        start: "0% 0%",
        end: "100% 100%",
        scrub: true,
        toggleActions: "play pause resume reverse",
        // markers: true,
    },
})
    .to(params, { scrollProgress: 1 }, 0)
    .to(scrollArrowEl, { duration: 0.2, y: 50, opacity: 0 }, 0)
    .to(scrollMsgEl, { opacity: 0 }, 0)
    .to(contentEl, { duration: 0.3, opacity: 1 }, 0.5)
    .progress(0);

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
render();

gsap.set(".page", { opacity: 1 });

function initShader() {
    const vsSource = document.getElementById("vertShader").innerHTML;
    const fsSource = document.getElementById("fragShader").innerHTML;

    const gl = canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl");

    if (!gl) alert("WebGL is not supported by your browser.");

    function createShader(gl, sourceCode, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader program error: " + gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
    uniforms = getUniforms(shaderProgram);

    function getUniforms(program) {
        let uniforms = [];
        let count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            let name = gl.getActiveUniform(program, i).name;
            uniforms[name] = gl.getUniformLocation(program, name);
        }
        return uniforms;
    }

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // HARD-CODED UNIFORMS INITIALLY
    gl.uniform1f(uniforms.u_col_width, params.colWidth);
    gl.uniform1f(uniforms.u_speed, params.speed);
    gl.uniform1f(uniforms.u_scale, params.scale);
    gl.uniform1f(uniforms.u_seed, params.seed);
    gl.uniform3f(uniforms.u_color, params.color[0], params.color[1], params.color[2]);

    return gl;
}

function render() {
    const currentTime = performance.now();
    gl.uniform1f(uniforms.u_time, currentTime);
    gl.uniform1f(uniforms.u_scroll_progr, params.scrollProgress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}

function resizeCanvas() {
    canvasEl.width = window.innerWidth * devicePixelRatio;
    canvasEl.height = window.innerHeight * devicePixelRatio;
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    gl.uniform2f(uniforms.u_resolution, canvasEl.width, canvasEl.height);
}
