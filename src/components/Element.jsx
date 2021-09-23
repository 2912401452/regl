import React from 'react'
import REGL from 'regl'

 export default class Element extends React.Component {
    componentDidMount() {
        this.regl = REGL("#index") // 构建 fullScreen Canvas 返回对应的上下文对象
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        var lineWidth = 3
        if (lineWidth > this.regl.limits.lineWidthDims[1]) {
            // console.log(this.regl.limits.lineWidthDims)
            lineWidth = this.regl.limits.lineWidthDims[1]
        }
        // console.log('lineWidth', lineWidth)

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
                void main () {
                    gl_Position = vec4(position, 0, 1);
                }`,    
            attributes: {
                position: (new Array(5)).fill().map((x, i) => {
                    var theta = 2.0 * Math.PI * i / 5
                    return [ Math.sin(theta), Math.cos(theta) ]
                })
            },    
            uniforms: {
                color: [1, 0, 0, 1]
            },    
            elements: [
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [1, 2],
                [1, 3],
                [1, 4],
                [2, 3],
                [2, 4],
                [3, 4]
            ],        
            lineWidth: 1
        })
        draw()
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
