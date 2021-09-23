import RenderMath from '../utils/math'
const mat4 = require('gl-mat4')


function triangle(params) {
    let uuid = RenderMath.generateUUID()
    let { 
        camera, 
        points = [
            [-5, 0, 0],
            [0, -5, 0], 
            [5, 5, 0]
        ], 
        color = [1, 1, 1, 1], 
        position = [0, 0, 0] 
    } = params

    let drawModelMatrix = mat4.fromTranslation(mat4.identity([]), position)
    let drawOptions = {
        frag: `
            precision mediump float;
            uniform vec4 color;
            void main () {
                gl_FragColor = color;
            }`,

        vert: `
            precision mediump float;
            attribute vec3 position;

            uniform mat4 proj;
            uniform mat4 model;
            uniform mat4 view;

            void main () {
                gl_Position = proj * view * model * vec4(position, 1);
            }`,

        attributes: {
            position: points
        },
        uniforms: {
            color,
            proj: ({ viewportWidth, viewportHeight }) => mat4.perspective([], Math.PI / 2, viewportWidth / viewportHeight, 0.01, 1000),
            model: drawModelMatrix,
            view: () => camera.view() 
        },
        count: 3,
        // customData: {
        //     uuid
        // }
    }

    return drawOptions
}

export default triangle
