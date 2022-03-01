import React from 'react'
import REGL from 'regl'
import { initSparks } from './utils/geometry'

const mat4 = require('gl-mat4')

export default class Demo extends React.Component {
    componentDidMount() {
        this.regl = REGL("#index") 
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        const { indices, vertices, normals, uvs, verticesOpacity } = initSparks(0.05, 18, 18, 24)
      
        const drawCube = this.regl({
            frag: `
            precision mediump float;

            varying vec2 vUv;

            varying float v_opacity;

            void main () {
                float fragmengTocenter = distance(vec2(0.5), gl_PointCoord) * 2.0;
                if(1.0 - smoothstep(0.05, 1.0, fragmengTocenter) <= 0.0) {
                    discard;
                }
                gl_FragColor = vec4(1.0, 1.0, 0.0, v_opacity);
            }`,
    
            vert: `
            precision mediump float;
            attribute vec3 position;
            attribute vec2 uv;
            attribute vec3 normals;
            attribute float verticesOpacity;
            uniform float t;
            varying vec2 vUv;
            varying float v_opacity;
            
            uniform mat4 projection, view;
            void main() {
                vUv = uv;
                float timestamp = fract(t/3.0);

                vec3 pos = position;

                if(timestamp > 0.5) {
                    pos += (timestamp - 0.5) * normals * 100.0;
                    pos.y += timestamp * 2.0;

                    float x = length(pos.xz);
                    float y = (-x*x + 2.0 * x) * 0.5;
    
                    pos.y += y;
                } else {
                    pos.xz *= vUv.y * 0.5;
                    pos.y += timestamp * 2.0; 
                    
                }

                v_opacity = verticesOpacity * (1.0 - timestamp)  * 2.0;

                gl_Position = projection * view * vec4(pos, 1);
                gl_PointSize = pow(length(position) + 1.5, 3.0);
            }`,
               
            attributes: {
                position: vertices,
                verticesOpacity,
                uv: uvs,
                normals: normals
            },
            elements: indices,
            blend: {
                enable: true,
                func: {
                  src: 'src alpha',
                  dst: 'one minus src alpha'
                }
              },
            primitive: 'points',
            uniforms: {
                view: ({ tick }) => {
                    const t = 0.01 * tick;
                    return mat4.lookAt( [],
                      [ 5 * Math.cos(t), 0.0, 5 * Math.sin(t) ],
                      [0, 1.0, 0],
                      [0, 5, 0])
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
              color: [0, 0, 0, 1],
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
