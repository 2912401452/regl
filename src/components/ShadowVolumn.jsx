import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')

 export default class ShadowVolumn extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        var gl = canvas.getContext('webgl', {
            antialias: true,
            stencil: true
        })

        fit(canvas)
        this.regl = REGL({ gl, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        const draw = this.regl({
            frag: `
                precision mediump float;
                uniform vec4 color;
                void main () {
                    gl_FragColor = color;
                }`,
    
            vert: `
                precision mediump float;
                attribute vec2 position;

                uniform mat4 proj;
                uniform mat4 model;
                uniform mat4 view;

                void main () {
                    gl_Position = proj * view * model * vec4(position, 0, 1);
                }`,
    
            attributes: {
                position: [
                    [-1, 0],
                    [0, -1],
                    [1, 1]
                ]
            },
    
            uniforms: {
                color: [1, 0, 0, 1],
                proj: ({ viewportWidth, viewportHeight }) =>
                mat4.perspective([],
                  Math.PI / 2,
                  viewportWidth / viewportHeight,
                  0.01,
                  1000),
                model: mat4.identity([]),
                view: () => camera.view() 
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
