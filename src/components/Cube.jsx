import React from 'react'
import REGL from 'regl'
import img from "./assets/peppers.png"

const mat4 = require('gl-mat4')

var cubePosition = [
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
    [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5] // bottom face
]

var cubeUv = [
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive z face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // positive x face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative z face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // negative x face.
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], // top face
    [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0] // bottom face
]

const cubeElements = [
    [2, 1, 0], [2, 0, 3], // positive z face.
    [6, 5, 4], [6, 4, 7], // positive x face.
    [10, 9, 8], [10, 8, 11], // negative z face.
    [14, 13, 12], [14, 12, 15], // negative x face.
    [18, 17, 16], [18, 16, 19], // top face.
    [20, 21, 22], [23, 20, 22] // bottom face
]

 export default class Cube extends React.Component {
    componentDidMount() {
        this.regl = REGL("#index") // 构建 fullScreen Canvas 返回对应的上下文对象
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        const drawCube = this.regl({
            frag: `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D tex;
            void main () {
              gl_FragColor = texture2D(tex,vUv);
            }`,
    
            vert: `
            precision mediump float;
            attribute vec3 position;
            attribute vec2 uv;
            varying vec2 vUv;
            uniform mat4 projection, view;
            void main() {
              vUv = uv;
              gl_Position = projection * view * vec4(position, 1);
            }`,
               
            attributes: {
                position: cubePosition,
                uv: cubeUv
            },
            elements: cubeElements,
            uniforms: {
                view: ({ tick }) => {
                    const t = 0.01 * tick
                    return mat4.lookAt([],
                      [5 * Math.cos(t), 2.5 * Math.sin(t), 5 * Math.sin(t)],
                      [0, 0.0, 0],
                      [0, 1, 0])
                  },
                  projection: ({ viewportWidth, viewportHeight }) =>
                    mat4.perspective([],
                      Math.PI / 4,
                      viewportWidth / viewportHeight,
                      0.01,
                      10),
                  tex: this.regl.prop('texture')
            }
        })

        let image = new Image()
        image.src = img
        image.onload = () => {
            this.regl.frame(() => {
                this.regl.clear({
                  color: [0, 0, 0, 255],
                  depth: 1
                })
                drawCube({ texture:  this.regl.texture({
                    data: image,
                    mag: 'linear',
                    min: 'linear'
                })})
            })
        }

        // require("resl")({
        //     manifest: {
        //         texture: {
        //             type: 'image',
        //             src: img,
        //             // src: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fhf.web.tedu.cn%2Fupload%2F20170608%2F20170608135206_259.jpg&refer=http%3A%2F%2Fhf.web.tedu.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1619532256&t=3704ff2b8a366c059054d16a06e08c79',
        //             parser: (data) => {
        //                 console.log(data)
        //                 return this.regl.texture({
        //                     data: data,
        //                     mag: 'linear',
        //                     min: 'linear'
        //                 })
        //             }
        //         }
        //     },
        //     onDone: ({ texture }) => {
        //         this.regl.frame(() => {
        //             this.regl.clear({
        //               color: [0, 0, 0, 255],
        //               depth: 1
        //             })
        //             drawCube({ texture })
        //         })
        //     },
        // })

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
