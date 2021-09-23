import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')

var N = 12 // number of floor tiles.
var TILE_WHITE = [1.0, 1.0, 1.0]
var TILE_BLACK = [0.4, 0.4, 0.4]
var TILE_ALPHA = 0.5
var FLOOR_SCALE = 70.0

var row
var col
var z
var x
var i

function createTiles (A) {
    var planeElements = []
    var planePosition = []
    var planeNormal = []
  
    for (row = 0; row <= N; ++row) {
      z = (row / N) - 0.5
      for (col = 0; col <= N; ++col) {
        x = (col / N) - 0.5
        planePosition.push([x, 0.0, z])
        planeNormal.push([0.0, 1.0, 0.0])
      }
    }
  
    for (row = 0; row <= (N - 1); ++row) {
      for (col = 0; col <= (N - 1); ++col) {
        i = row * (N + 1) + col
  
        var i0 = i + 0
        var i1 = i + 1
        var i2 = i + (N + 1) + 0
        var i3 = i + (N + 1) + 1
  
        if ((col + row) % 2 === A) {
          planeElements.push([i3, i1, i0])
          planeElements.push([i0, i2, i3])
        }
      }
    }
  
    return {
      planeElements: planeElements,
      planePosition: planePosition,
      planeNormal: planeNormal
    }
}

export default class Reflection extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        var gl = canvas.getContext('webgl', {
            antialias: true,
            stencil: true
          })
        this.regl = REGL({ gl, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        camera.rotate([0.0, 0.0], [0.0, -0.4])
        camera.zoom(50.0)
        window.addEventListener('resize', fit(canvas), false)

        const globalScope = this.regl({
            uniforms: {
              lightDir: [0.39, 0.87, 0.29],
              view: () => camera.view(),
              projection: ({ viewportWidth, viewportHeight }) =>
                mat4.perspective([],
                  Math.PI / 4,
                  viewportWidth / viewportHeight,
                  0.01,
                  1000),
              yScale: 1.0 // by default, do not render mirrored.
            },
          
            frag: `
            precision mediump float;
          
            varying vec3 vNormal;
            varying vec3 vPosition;
          
            uniform float ambientLightAmount;
            uniform float diffuseLightAmount;
            uniform vec3 lightDir;
          
            uniform vec3 color;
            uniform float yScale;
            uniform float alpha;
          
            void main () {
              vec3 ambient = ambientLightAmount * color;
              float cosTheta = dot(vNormal, lightDir * vec3(1.0, yScale, 1.0));
              vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
          
              gl_FragColor = vec4((ambient + diffuse), alpha);
            }`,
            vert: `
            precision mediump float;
          
            attribute vec3 position;
            attribute vec3 normal;
          
            varying vec3 vPosition;
            varying vec3 vNormal;
          
            uniform mat4 projection, view, model;
            uniform float yScale;
          
            void main() {
              vec4 worldSpacePosition = model * vec4(position, 1);
              worldSpacePosition.y *= yScale;
          
              vPosition = worldSpacePosition.xyz;
              vNormal = normal;
          
              gl_Position = projection * view * worldSpacePosition;
            }`,
          
            // we use alpha blending to render the mirrored floor.
            blend: {
              enable: true,
              func: {
                src: 'src alpha',
                dst: 'one minus src alpha'
              }
            }
        })

        // draw the reflection of a mesh.
        // also, use the stencil buffer to make sure that we
        // only draw the reflection in the reflecting floor tiles.
        const drawReflect = this.regl({
            uniforms: {
                yScale: -1.0
            },
            cull: {
                // must do this, since we mirrored the mesh.
                enable: true,
                face: 'front'
            },
            stencil: {
                enable: true,
                mask: 0xff,
                func: {
                    cmp: 'equal',
                    ref: 1,
                    mask: 0xff
                }
            }
        })

        // create the mask that is used to make sure that we
        // only render the reflections in the reflecting floor tiles.
        const createMask = this.regl({
            stencil: {
                enable: true,
                mask: 0xff,
                func: {
                    cmp: 'always',
                    ref: 1,
                    mask: 0xff
                },
                opFront: {
                    fail: 'replace',
                    zfail: 'replace',
                    zpass: 'replace'
                }
            },
            // we want to write only to the stencil buffer,
            // so disable these masks.
            colorMask: [false, false, false, false],
            depth: {
                enable: true,
                mask: false
            }
        })
        
        function Mesh (elements, position, normal) {
            this.elements = elements
            this.position = position
            this.normal = normal
          }
          
        Mesh.prototype.draw = this.regl({
            uniforms: {
              model: (_, props, batchId) => {
                var m = mat4.identity([])
          
                if (typeof props.translate !== 'undefined') {
                  mat4.translate(m, m, props.translate)
                }
          
                var s = props.scale
                mat4.scale(m, m, [s, s, s])
                return m
              },
              ambientLightAmount: 0.3,
              diffuseLightAmount: 0.7,
              color: this.regl.prop('color'),
              alpha: (_, props) => {
                if (typeof props.alpha !== 'undefined') {
                  return props.alpha
                } else {
                  return 1.0
                }
              }
            },
            attributes: {
              position: this.regl.this('position'),
              normal: this.regl.this('normal')
            },
            elements: this.regl.this('elements'),
            cull: {
              enable: true
            }
        })
        
        var bunnyMesh = new Mesh(bunny.cells, bunny.positions, normals(bunny.cells, bunny.positions))

        // the white tiles is one mesh, and the black tiles is another.
        // we need to render the white tiles separately to the stencil buffer to
        // create the mask, so we split them into two meshes like this.
        var obj = createTiles(0)
        var whiteTilesMesh = new Mesh(obj.planeElements, obj.planePosition, obj.planeNormal)

        obj = createTiles(1)
        var blackTilesMesh = new Mesh(obj.planeElements, obj.planePosition, obj.planeNormal)
        
        this.regl.frame(({tick}) => {
            this.regl.clear({
                color: [0, 0, 0, 255],
                depth: 1,
                stencil: 0
            })

            var drawMeshes = () => {
                var i
                var theta
                var R
                var r, g, b
                var phi0 = 0.01 * tick
            
                for (i = 0; i < 1.0; i += 0.1) {
                  theta = Math.PI * 2 * i
                  R = 20.0
            
                  r = ((Math.abs(23232 * i * i + 100212) % 255) / 255) * 0.4 + 0.3
                  g = ((Math.abs(32278 * i + 213) % 255) / 255) * 0.4 + 0.15
                  b = ((Math.abs(3112 * i * i * i + 2137 + i) % 255) / 255) * 0.05 + 0.05
            
                  bunnyMesh.draw({ scale: 0.7, translate: [R * Math.cos(theta + phi0), 1.0, R * Math.sin(theta + phi0)], color: [r, g, b] })
                }
            }

              globalScope(() => {
                //
                // First, draw the reflections of the meshes.
                //
                createMask(() => { // create mask
                  whiteTilesMesh.draw({ scale: FLOOR_SCALE, color: TILE_WHITE, alpha: TILE_ALPHA })
                })
                // createMask(() => {
                //   blackTilesMesh.draw({ scale: FLOOR_SCALE, color: TILE_WHITE, alpha: TILE_ALPHA })
                // })

                drawReflect(() => { // draw reflect bunnys
                    drawMeshes()
                })
                whiteTilesMesh.draw({ scale: FLOOR_SCALE, color: TILE_WHITE, alpha: TILE_ALPHA })
                blackTilesMesh.draw({ scale: FLOOR_SCALE, color: TILE_BLACK })

                //
                // Now draw the actual meshes.
                //
                drawMeshes() // draw bunnys
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
