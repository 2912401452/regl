import React from 'react'
import REGL from 'regl'

const normals = require('angle-normals')
const bunny = require('bunny')
const createCamera = require('./utils/camera')

 export default class Geomorph extends React.Component {
    componentDidMount() {
        this.regl = REGL("#index") // 构建 fullScreen Canvas 返回对应的上下文对象
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        this.camera = createCamera(this.regl, {
            center: [0, 2.5, 0]
        })
        const drawBunny = this.regl({
            frag: `
              precision mediump float;
              varying vec3 vnormal;
              void main () {
                gl_FragColor = vec4(abs(vnormal), 1.0);
              }`,
            vert: `
              precision mediump float;
              uniform mat4 projection, view;
              attribute vec3 position, normal;
              varying vec3 vnormal;
              void main () {
                vnormal = normal;
                gl_Position = projection * view * vec4(position, 1.0);
              }`,
            attributes: {
              position: bunny.positions,
              normal: normals(bunny.cells, bunny.positions)
            },
            elements: bunny.cells
        })

        this.regl.frame(() => {
            this.regl.clear({
              color: [0, 0, 0, 1]
            })
            this.camera(() => {
              drawBunny()
            })
        })
    }
    render() {
        return (
        <div id="index" ref={el=>this.container = el} style={{
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
