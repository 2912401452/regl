import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')

 export default class Blur extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        // increase and decrease the blur amount by modifying this value.
        const FILTER_RADIUS = 5

        // create fbo. We set the size in `regl.frame`
        const fbo = this.regl.framebuffer({
            color: this.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp'
            }),
            depth: true
        })

        const setupDefault = this.regl({
            cull: {
                enable: true
              },
            frag: `
                precision mediump float;
                varying vec3 vNormal;
                void main () {
                    gl_FragColor = vec4(vNormal, 1.0);
                }`,
            vert: `
                precision mediump float;
                attribute vec3 position;
                attribute vec3 normal;

                uniform mat4 proj;
                uniform mat4 model;
                uniform mat4 view;

                varying vec3 vNormal;
                void main () {
                    vNormal = normal;
                    gl_Position = proj * view * model * vec4(position, 1);
                }`,
    
            
            framebuffer: fbo,
            uniforms: {
                proj: ({ viewportWidth, viewportHeight }) => mat4.perspective([], Math.PI / 2, viewportWidth / viewportHeight, 0.01, 1000),
                model: mat4.identity([]),
                view: () => camera.view() 
            }
        })

        const drawBunny = this.regl({
            attributes: {
                position: bunny.positions,
                normal: normals(bunny.cells, bunny.positions)
            },
            elements: bunny.cells,
        })

        const drawFboBlurred = this.regl({
            frag: `
            precision mediump float;
            varying vec2 uv;
            uniform sampler2D tex;
            uniform float wRcp, hRcp;
            #define R int(${FILTER_RADIUS})
          
            void main() {
          
              float W =  float((1 + 2 * R) * (1 + 2 * R));
          
              vec3 avg = vec3(0.0);
              for (int x = -R; x <= +R; x++) {
                for (int y = -R; y <= +R; y++) {
                  avg += (1.0 / W) * texture2D(tex, uv + vec2(float(x) * wRcp, float(y) * hRcp)).xyz;
                }
              }
          
              gl_FragColor = vec4(avg, 1.0);
            }`,
          
            vert: `
            precision mediump float;
            attribute vec2 position;
            varying vec2 uv;
            void main() {
              uv = 0.5 * (position + 1.0);
              gl_Position = vec4(position, 0, 1);
            }`,
            attributes: {
              position: [ -4, -4, 4, -4, 0, 4 ]
            },
            uniforms: {
              tex: ({ count }) => fbo,
              wRcp: ({ viewportWidth }) => 1.0 / viewportWidth,
              hRcp: ({ viewportHeight }) => 1.0 / viewportHeight
            },
            depth: { enable: false },
            count: 3
        })

        this.regl.clear({
            color: [0, 0, 0, 255],
            depth: 1
        })

        this.regl.frame(({ deltaTime, viewportWidth, viewportHeight }) => {
            fbo.resize(viewportWidth, viewportHeight)

            setupDefault({}, () => { // draw background and bunny to fbo
 
                this.regl.clear({ // clear fbo cache
                    color: [0, 0, 0, 255],
                    depth: 1
                })

                drawBunny()
            })
            
        
            this.regl.clear({   // clear default render target cache
                color: [0, 0, 0, 255],
                depth: 1
            })

            drawFboBlurred()

            camera.tick()
        })

          
        
        // this.regl.frame(() => {
        //     this.regl.clear({ color: [0, 0, 0, 1] })
        //     setupDefault()
        //     camera.tick()
        // })
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
