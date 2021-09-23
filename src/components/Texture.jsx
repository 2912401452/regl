import React from 'react'
import REGL from 'regl'

const tex = require('baboon-image')

const fit = require('canvas-fit')


 export default class Texture extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)

        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })
        
        window.addEventListener('resize', fit(canvas), false)
     
        this.regl({
            vert: `
            precision mediump float;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main () {
                vUv = uv;
                gl_Position = vec4(position, 0, 1);
            }`,
            frag: `
            precision mediump float;
            uniform sampler2D texture;
            varying vec2 vUv;
            void main () {
              gl_FragColor = texture2D(texture, vUv);
              
            }`,
            attributes: {
                position: [
                    -1, +1, 
                    +1, +1, 
                    +1, -1, 
                    -1, -1
                ],
                uv: [
                    0.0, 0.0, 
                    1.0, 0.0, 
                    1.0, 1.0, 
                    0.0, 1.0
                ]
            },
            uniforms: {
              texture: this.regl.texture({
                    data: tex,
                    mag: 'linear',
                    min: 'linear'
              })
            },
            elements: [
                [2, 1, 0], 
                [2, 0, 3]
            ]
          })()
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
