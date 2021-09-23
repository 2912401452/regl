import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const bunny = require('bunny')
const fit = require('canvas-fit')
const normals = require('angle-normals')

 export default class Instances extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))

        this.regl = REGL({ canvas: canvas, extensions: ['angle_instanced_arrays'] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)


        var N = 15 // N bunnies on the width, N bunnies on the height.
        camera.rotate([0.0, 0.0], [0.0, -0.4])
        camera.zoom(70.0)

        var angle = []
        for (var i = 0; i < N * N; i++) {
            angle[i] = Math.random() * (2 * Math.PI) // generate random initial angle.
        }
        
       
        const angleBuffer = this.regl.buffer({ // This buffer stores the angles of all the instanced bunnies.
            length: angle.length * 4,
            type: 'float',
            usage: 'dynamic'
        })

        const draw = this.regl({
            frag: `
                precision mediump float;
                varying vec3 vNormal;
                varying vec3 vColor;
                void main () {
                    vec3 color = vColor;
                    vec3 ambient = vec3(0.3) * color;

                    vec3 lightDir = vec3(0.39, 0.87, 0.29);
                    vec3 diffuse = vec3(0.7) * color * max(dot(vNormal, lightDir) , 0.0 );

                    gl_FragColor = vec4(ambient + diffuse, 1.0);
                }`,
    
            vert: `
                precision mediump float;
                attribute vec3 position;
                attribute vec3 normal;
                attribute vec3 offset;
                attribute float angle;

                uniform mat4 proj;
                uniform mat4 model;
                uniform mat4 view;

                attribute vec3 color;
                varying vec3 vColor;

                varying vec3 vNormal;
                void main () {
                    vColor = color;
                    vNormal = normal;
                    gl_Position = proj * view * model * vec4(
                        +cos(angle) * position.x + position.z * sin(angle) + offset.x,
                        position.y + offset.y,
                        -sin(angle) * position.x  + position.z * cos(angle) + offset.z,
                        1.0);
                }`,
    
            attributes: {
                position: bunny.positions,
                normal: normals(bunny.cells, bunny.positions),
                angle: {
                    buffer: angleBuffer,
                    divisor: 1
                },
                offset: {
                    buffer: this.regl.buffer(
                      Array(N * N).fill().map((_, i) => {
                        var x = (-1 + 2 * Math.floor(i / N) / N) * 120
                        var z = (-1 + 2 * (i % N) / N) * 120
                        return [x, 0.0, z]
                      })),
                    divisor: 1
                },
                color: {
                    buffer: this.regl.buffer(
                      Array(N * N).fill().map((_, i) => {
                        var x = Math.floor(i / N) / (N - 1)
                        var z = (i % N) / (N - 1)
                        return [
                          x * z * 0.3 + 0.7 * z,
                          x * x * 0.5 + z * z * 0.4,
                          x * z * x + 0.35
                        ]
                      })),
                    divisor: 1
                  },
            },
            uniforms: {
                proj: ({ viewportWidth, viewportHeight }) =>
                mat4.perspective([],
                  Math.PI / 2,
                  viewportWidth / viewportHeight,
                  0.01,
                  1000),
                model: mat4.identity([]),
                view: () => camera.view()
            },
            elements: bunny.cells,
            instances: N * N,
        })
        
        this.regl.frame(() => {
            this.regl.clear({ color: [0, 0, 0, 1] })
            draw()

            for (var i = 0; i < N * N; i++) {
                angle[i] += 0.01
            }
            angleBuffer.subdata(angle)

            camera.tick()
        })
    }
    render() {
        return (
        <div id="index" ref={el=>this.el=el} style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }}>
        </div>
        );
    }
}
