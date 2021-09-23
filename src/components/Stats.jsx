import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const createStatsWidget = require('regl-stats-widget')

 export default class Stats extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))

        this.regl = REGL({ 
            canvas: canvas, 
            extensions: ['ext_disjoint_timer_query'],
            profile: true
         })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        const globalCommand = this.regl({
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
                    [-5, 0],
                    [0, -5],
                    [5, 5]
                ]
            },
            uniforms: {
                proj: ({ viewportWidth, viewportHeight }) => mat4.perspective([], Math.PI / 2, viewportWidth / viewportHeight, 0.01, 1000),
                view: () => camera.view()
            },
            count: 3
        })

        var statsWidget = createStatsWidget([
            [globalCommand, "globalCommand"]
        ])
        
        const deltaTime = 0.017
        statsWidget.update(deltaTime)

        this.regl.frame(() => {
            this.regl.clear({ color: [0, 0, 0, 1] })
           
            const deltaTime = 0.017
            statsWidget.update(deltaTime)
            
            globalCommand({}, () => { // globalCommand 复用了一部分 regl 对象
                this.regl({ // sub command
                    uniforms: {
                        color: [1, 0, 0, 1],
                        model: mat4.translate(mat4.identity([]), mat4.identity([]), [0, 10, 0])
                    },
                })()
                
                this.regl({
                    uniforms: {
                        color: [1, 1, 0, 1],
                        model: mat4.translate(mat4.identity([]), mat4.identity([]), [0, 0, 0])
                    },
                })()
            })
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
