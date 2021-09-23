import React from 'react'
import REGL from 'regl'
// posx, negx, posy, negy, posz, negz
import posx from "./assets/posx.jpg"
import negx from "./assets/negx.jpg"
import posy from "./assets/posy.jpg"
import negy from "./assets/negy.jpg"
import posz from "./assets/posz.jpg"
import negz from "./assets/negz.jpg"

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')

 export default class Envmap extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        window.addEventListener('resize', fit(canvas), false)

        const setupEnvMap = this.regl({
            frag: `
            precision mediump float;
            uniform samplerCube envmap;
            varying vec3 reflectDir;
            void main () {
              gl_FragColor = textureCube(envmap, reflectDir);
            }`,
            uniforms: {
                envmap: this.regl.prop('cube'),
                view: this.regl.prop('view'),
                projection: ({ viewportWidth, viewportHeight }) =>
                  mat4.perspective([],
                    Math.PI / 4,
                    viewportWidth / viewportHeight,
                    0.01,
                    1000),
                invView: () => mat4.invert([], camera.view())
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
              vec4 eye = invView * vec4(0, 0, 0, 1);
              reflectDir = reflect(
                normalize(position.xyz - eye.xyz / eye.w),
                normal);
              gl_Position = projection * view * vec4(position, 1);
            }`,
            attributes: {
              position: bunny.positions,
              normal: normals(bunny.cells, bunny.positions)
            },
            elements: bunny.cells
          })
          

          require('resl')({
            manifest: {
                posx: {
                  type: 'image',
                  src: posx
                },
                negx: {
                  type: 'image',
                  src: negx
                },
                posy: {
                  type: 'image',
                  src: posy
                },
                negy: {
                  type: 'image',
                  src: negy
                },
                posz: {
                  type: 'image',
                  src: posz
                },
                negz: {
                  type: 'image',
                  src: negz
                }
              },
              onDone: ({ posx, negx, posy, negy, posz, negz }) => {

                const cube = this.regl.cube(
                    posx, negx,
                    posy, negy,
                    posz, negz)
                    this.regl.frame(() => {
                        
                        setupEnvMap({ cube, view: camera.view() }, () => {
                            drawBackground()
                            drawBunny()
                        })

                        camera.tick()
                    })
              },
              onProgress: (fraction) => {
                const intensity = 1.0 - fraction
                this.regl.clear({
                  color: [intensity, intensity, intensity, 1]
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
