import React from 'react'
import REGL from 'regl'

const tex = require('baboon-image')

const fit = require('canvas-fit')


 export default class Sprite extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)

        this.regl = REGL({ canvas: canvas, extensions: [], attributes: {
            antialias: true
        } })
        this.regl.clear({ color: [1, 1, 1, 1] })
        
        window.addEventListener('resize', fit(canvas), false)
     
        const draw = this.regl({
            vert: `
            void main () {
                gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                gl_PointSize = 40.0;
            }`,
            frag: `
            precision mediump float;
            uniform sampler2D texture;
            void main () {
              gl_FragColor = texture2D(texture, gl_PointCoord);
              
            }`,
            primitive: "points",
            uniforms: {
                texture: this.regl.prop('texture')
            },
            count: 1,
            blend: {
                enable: true,
                func: {
                  srcRGB: 'src alpha',
                  srcAlpha: 1,
                  dstRGB: 'one minus src alpha',
                  dstAlpha: 1
                },
                equation: {
                  rgb: 'add',
                  alpha: 'add'
                },
                color: [0, 0, 0, 0]
              },
          })

          require("resl")({
            manifest: {
                texture: {
                    type: 'image',
                    // src: img,
                    src: "https://gw-office.alipayobjects.com/bmw-prod/ae2a8580-da3d-43ff-add4-ae9c1bfc75bb.svg",
                    parser: (data) => this.regl.texture({
                        data: data,
                        mag: 'linear',
                        min: 'linear'
                    })
                }
            },
            onDone: ({ texture }) => {
                this.regl.frame(() => {
                    this.regl.clear({
                      color: [1, 1, 1, 1],
                      depth: 1
                    })
                    draw({ texture })
                })
            },
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
