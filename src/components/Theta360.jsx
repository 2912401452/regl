import React from 'react'
import REGL from 'regl'
import img from "./assets/ogd-oregon-360.jpg"

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')

 export default class Theta360 extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const envmap = this.regl.texture()

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

       

        const setupEnvMap = this.regl({
            frag: `
            precision mediump float;
            uniform sampler2D envmap;
            varying vec3 reflectDir;
          
            #define PI ${Math.PI}
          
            vec4 lookupEnv (vec3 dir) {
              float lat = atan(dir.z, dir.x);
              float lon = acos(dir.y / length(dir));
              return texture2D(envmap, vec2(
                0.5 + lat / (2.0 * PI),
                lon / PI));
            }
          
            void main () {
              gl_FragColor = lookupEnv(reflectDir);
            }`,
          
            uniforms: {
              envmap: envmap,
          
              view: this.regl.prop('view'),
          
              projection: ({ viewportWidth, viewportHeight }) =>
                mat4.perspective([],
                  Math.PI / 4,
                  viewportWidth / viewportHeight,
                  0.01,
                  1000),
          
              invView: (context, { view }) => mat4.invert([], view)
            }
        })

        const drawBackground = this.regl({
            vert: `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 view;
            varying vec3 reflectDir;
            void main() {
              reflectDir = (view * vec4(position, 1, 0)).xyz;
              gl_Position = vec4(position, 0, 1);
            }`,
          
            attributes: {
              position: [
                -4, -4,
                -4, 4,
                8, 0]
            },
            depth: {
              mask: false,
              enable: false
            },
          
            count: 3
        })

        const drawBunny = this.regl({
            vert: `
            precision mediump float;
            attribute vec3 position, normal;
            uniform mat4 projection, view, invView;
            varying vec3 reflectDir;
            void main() {
              vec4 cameraPosition = view * vec4(position, 1);
              vec3 eye = normalize(position - invView[3].xyz / invView[3].w);
              reflectDir = reflect(eye, normal);
              gl_Position = projection * cameraPosition;
            }`,
          
            attributes: {
              position: bunny.positions,
              normal: normals(bunny.cells, bunny.positions)
            },
          
            elements: bunny.cells
          })

        require('resl')({
            manifest: {
                envmap: {
                  type: 'image',
                  stream: true,
                  src: img,
                  parser: envmap
                }
            },
            onDone: () => {
                
                this.regl.frame(() => {
                    this.regl.clear({ color: [0, 0, 0, 1] })
                    setupEnvMap({
                        view: camera.view() 
                    }, () => {
                        drawBackground()    // 先绘制背景（背景的绘制不放入深度中，让 bunny 一直在背景三角板的前方）
                        drawBunny()         // 后绘制 bunny 模型
                    })

                    camera.tick()
                })
            }
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
