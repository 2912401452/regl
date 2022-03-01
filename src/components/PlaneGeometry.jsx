import React from 'react'
import REGL from 'regl'
import { initPlane } from './utils/geometry'

const mat4 = require('gl-mat4')

export default class Demo extends React.Component {
    componentDidMount() {
        this.regl = REGL({
            canvas: document.getElementById("#index"),
            extensions: ['OES_standard_derivatives'],
            optionalExtensions: [],
        }) // 构建 fullScreen Canvas 返回对应的上下文对象
        this.regl.clear({
            color: [0, 0, 0, 1]
        })

        const { indices, vertices, normals, uvs } = initPlane(2, 2, 10, 10)
        // const { indices, vertices, normals, uvs } = initPlane(2, 2)
        // console.log(vertices)
        // const barycentrics = vertices.map((v, i) => {
        //     if (i % 9 === 0 || i % 9 === 4 || i % 9 === 8) {
        //         return 1.0;
        //     }
        //     return 0.0;
        // });
        // console.log('barycentrics', barycentrics)

        var vectors = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];

        // var itemSize = 3, array = new Array(vertices.length);
        // var index = 0, index2 = 0;
        // for ( var i = 0, l = indices.length; i < l; i ++ ) {

        //     index = indices[ i ] * itemSize;

        //     for ( var j = 0; j < itemSize; j ++ ) {

        //         array[ index2 ++ ] = vertices[ index ++ ];

        //     }

        // }
        // console.log(array)

        // var centers = [];
        // for ( var i = 0;i < vertices.length/3; i ++ ) {
        //     centers.push(...vectors[ i % 3 ])
        // }
        // console.log('centers', centers)
        // console.log('barycentric', barycentric)
        const drawCube = this.regl({
            frag: `
            precision mediump float;

            varying vec2 vUv;
            // varying vec3 v_barycentrics;

            // #extension GL_OES_standard_derivatives : enable
            // float edgeFactorTri(){
            //     vec3 d = fwidth(v_barycentrics);
            //     // 边缘平滑效果
            //     vec3 a3 = smoothstep(vec3(0.0), d * 1.5, v_barycentrics);
            //     return min(min(a3.x, a3.y), a3.z);
            // }

            void main () {
                gl_FragColor = vec4(vUv, 0.0, 1.0);
                // // 小于边框宽度
                // if (any(lessThan(v_barycentrics, vec3(0.1)))) {
                //     // 边框颜色
                //     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                // }
                // else {
                //     // 填充背景颜色
                //     gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
                // }
                // gl_FragColor.rgb = mix( vec3( 1.0 ), vec3( 0.2 ), edgeFactorTri() );
				// gl_FragColor.a = 1.0;

            }`,
    
            vert: `
            precision mediump float;
            attribute vec3 position;
            attribute vec2 uv;
            // attribute vec3 barycentrics;
            uniform float t;
            varying vec2 vUv;
            // varying vec3 v_barycentrics;

            uniform mat4 projection, view;
            void main() {
              vUv = uv;
            //   v_barycentrics = barycentrics;
            float x = position.x + fract(t);
            vec3 pos = vec3(x, position.yz);
              gl_Position = projection * view * vec4(pos, 1);
              gl_PointSize = 10.0;
            }`,
               
            attributes: {
                // position: cubePosition,
                // uv: cubeUv
                position: vertices,
                uv: uvs,
                // barycentrics: barycentric
            },
            // elements: cubeElements,
            elements: indices,
            // primitive: 'points', //'triangles',
            primitive: 'triangles',
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
                      t: this.regl.prop('t')
            }
        })

        let t = 0
        this.regl.frame(() => {
            this.regl.clear({
              color: [0, 0, 0, 255],
              depth: 1
            })
            t += 0.02
            drawCube({t: t})
        })
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
