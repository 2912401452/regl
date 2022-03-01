import React from 'react'
import REGL from 'regl'
import { initSphere, initSparks } from './utils/geometry'

const mat4 = require('gl-mat4')

export default class Demo extends React.Component {
    componentDidMount() {
        this.regl = REGL({
            canvas: document.getElementById("#index"),
            extensions: ['OES_standard_derivatives'],
            optionalExtensions: [],
        }) // 构建 fullScreen Canvas 返回对应的上下文对象
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        const { indices, vertices, normals, uvs } = initSphere(1, 12, 12)
        // const { indices, vertices, normals, uvs, verticesOpacity } = initSparks(0.2, 12, 12, 18)
      
        const drawCube = this.regl({
            frag: `
            precision mediump float;

            varying vec2 vUv;


            void main () {
           

                gl_FragColor = vec4(vUv, 0.0, 1.0);
            }`,
    
            vert: `
            precision mediump float;
            attribute vec3 position;
            attribute vec2 uv;
            attribute vec3 normals;
            uniform float t;
            varying vec2 vUv;
            
            uniform mat4 projection, view;
            void main() {
                vUv = uv;
                float timestamp = fract(t/5.0); // -0.5 - 0.5
                // if(timestamp < 0.0) {
                //     timestamp = timestamp * -1.0;
                // } // timestamp 0.5 - 0 - 0.5

               

                gl_Position = projection * view * vec4(position, 1);
                gl_PointSize = 10.0;
            }`,
               
            attributes: {
                // position: cubePosition,
                // uv: cubeUv
                position: vertices,
                // verticesOpacity,
                uv: uvs,
                normals: normals
                // barycentrics: barycentric
            },
            // elements: cubeElements,
            elements: indices,
            blend: {
                enable: true,
                func: {
                  src: 'src alpha',
                  dst: 'one minus src alpha'
                }
              },
            primitive: 'points', //'triangles',
            // primitive: 'triangles',
            uniforms: {
                view: ({ tick }) => {
                    const t = 0.01 * tick
                    // const t = 0.01
                    return mat4.lookAt([],
                      [
                          5 * Math.cos(t), 
                            0.0,//   2.5 * Math.sin(t), 
                          5 * Math.sin(t)
                        ],
                      [0, 0.0, 0],
                      [0, 1, 0])
                  },
                  projection: ({ viewportWidth, viewportHeight }) =>
                    mat4.perspective([],
                      Math.PI / 4,
                      viewportWidth / viewportHeight,
                      0.01,
                      10),
                      t: this.regl.prop('t')
            }
        })

        let t = 0
        this.regl.frame(() => {
            this.regl.clear({
              color: [0, 0, 0, 255],
              depth: 1
            })
            t += 0.02
            drawCube({t: t})
        })
    }
    render() {
        return (
        <div id="index" style={{
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
