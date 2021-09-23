import React from 'react'
import REGL from 'regl'

// const mat4 = require('gl-mat4')
const fit = require('canvas-fit')

 export default class TexAttr extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        // const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        const draw = this.regl({
            frag: `
            precision mediump float;
            uniform sampler2D texture;
            varying vec2 uv;
            void main () {
              gl_FragColor = texture2D(texture, uv);
            // gl_FragColor = texture2D(texture, vec2(0.1, 0.1));
            }`,
          
            vert: `
            precision mediump float;
            attribute vec2 position;
            attribute vec2 a_uv;
            varying vec2 uv;
            void main () {
                uv = a_uv;
                gl_Position = vec4(position, 0.0, 1.0);
            }`,
          
            attributes: {
                position: [
                    [-0.5, +0.5], [+0.5, +0.5], [+0.5, -0.5], [-0.5, -0.5], // by elements
                ],
                a_uv: [
                    [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]
                ]
            },
            elements: [[2, 1, 0], [2, 0, 3]], // by elements
          
            uniforms: {
          
              texture: this.regl.texture({
                min: 'linear mipmap linear',
                mag: 'nearest',
                wrap: 'repeat',
                flipY: true,
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
          
            // count: 3
        })
        
        this.regl.frame(() => {
            this.regl.clear({
                color: [1.0, 0, 0, 255],
                depth: 1
            })
            draw()

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
