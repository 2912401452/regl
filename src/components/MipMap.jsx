import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')

 export default class MipMap extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        const draw = this.regl({
            frag: `
            precision mediump float;
            uniform sampler2D texture;
            uniform float tick;
            varying vec2 uv;
            void main () {
              mat3 m = mat3(
                cos(tick), sin(tick), -1.1 + cos(tick),
                -sin(tick), cos(tick), 0,
                0, 0, 1);
              vec3 p = m * vec3(uv, 1);
              gl_FragColor = texture2D(texture, p.xy / p.z);
            }`,
          
            vert: `
            precision mediump float;
            attribute vec2 position;
            varying vec2 uv;
            void main () {
              uv = position;
              gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
            }`,
          
            attributes: {
              position: [
                -2, 0,
                0, -2,
                2, 2]
            },
          
            uniforms: {
              tick: ({ tick }) => 0.005 * tick,
          
              texture: this.regl.texture({
                min: 'linear mipmap linear',
                mag: 'nearest',
                wrap: 'repeat',
                data: [
                  [255, 255, 255, 255, 0, 0, 0, 0],
                  [255, 255, 255, 255, 0, 0, 0, 0],
                  [255, 255, 255, 255, 0, 0, 0, 0],
                  [255, 255, 255, 255, 0, 0, 0, 0],
                  [0, 0, 0, 0, 255, 255, 255, 255],
                  [0, 0, 0, 0, 255, 255, 255, 255],
                  [0, 0, 0, 0, 255, 255, 255, 255],
                  [0, 0, 0, 0, 255, 255, 255, 255]
                ]
              })
            },
          
            count: 3
        })
        
        this.regl.frame(() => {
            this.regl.clear({
                color: [0, 0, 0, 255],
                depth: 1
            })
            draw()

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
