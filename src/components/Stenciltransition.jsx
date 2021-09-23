import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')
var boundingBox = require('vertices-bounding-box')
var tform = require('geo-3d-transform-mat4')
var seedrandom = require('seedrandom')

// center the rabbit mesh to the origin.
function centerMesh (mesh) {
    var bb = boundingBox(mesh.positions)
  
    var _translate = [
      -0.5 * (bb[0][0] + bb[1][0]),
      -0.5 * (bb[0][1] + bb[1][1]),
      -0.5 * (bb[0][2] + bb[1][2])
    ]
    var translate = mat4.create()
    mat4.translate(translate, translate, _translate)
    mesh.positions = tform(mesh.positions, translate)
}
centerMesh(bunny)

var boxPosition = [
    // side faces
    [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
    [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
    [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
    [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
    [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
    [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5] // bottom face
]
  
const boxElements = [
    [2, 1, 0], [2, 0, 3],
    [6, 5, 4], [6, 4, 7],
    [10, 9, 8], [10, 8, 11],
    [14, 13, 12], [14, 12, 15],
    [18, 17, 16], [18, 16, 19],
    [20, 21, 22], [23, 20, 22]
]
  
// all the normals of a single block.
var boxNormal = [
    // side faces
    [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0],
    [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0],
    [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0],
    // top
    [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0],
    // bottom
    [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0]
]

var rng = seedrandom('seed.')

var textures = [] // transition textures.
var TEX_W = 64 // width of a transition texture
var TEX_H = 64 // height of a transition texture
var N_TEX = 20 // how many transition textures we use.



export default class Stenciltransition extends React.Component {
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
        window.addEventListener('resize', fit(canvas), false)

        /*
        To implement the transition effect, we have a bunch of textures that we cycle through, and
        render to the stencul buffer.

        The texture returned by makeTexture(0) is all white, and makeTexture(1.0) is all black.
        But makeTexture(0.5) will be random noise, where about in average, half the pixels are white, and
        the other half are black.
        */
        let makeTexture = (f) => {
            var texData = []
        
            for (var y = 0; y < TEX_W; y++) {
                var r = []
                for (var x = 0; x < TEX_H; x++) {
                    var rand = rng()
                    var g = rand > f ? 255 : 0
            
                    r.push([g, g, g, 255])
                }
                texData.push(r)
            }
            // console.log(texData);
            console.log(this.regl.texture({
                mag: 'nearest',
                wrap: 'repeat',
                data: texData
            }))
            return this.regl.texture({
                mag: 'nearest',
                wrap: 'repeat',
                data: texData
            })
        }
  
        // create all transition textures.
        for (var i = 0; i <= N_TEX; i++) {
            textures[i] = makeTexture(i / N_TEX)
        }

        const globalScope = this.regl({
            cull: {
              enable: true
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
          
                var s = props.scale
                mat4.scale(m, m, [s, s, s])
                return m
              },
              ambientLightAmount: 0.3,
              diffuseLightAmount: 0.7,
              color: this.regl.prop('color'),
              lightDir: [0.39, 0.87, 0.29],
              view: () => { return mat4.lookAt([], [0.0, 10.0, 20.0], [0, 0, 0], [0, 1, 0]) },
              projection: ({ viewportWidth, viewportHeight }) =>
                mat4.perspective([],
                  Math.PI / 4,
                  viewportWidth / viewportHeight,
                  0.01,
                  1000)
            },
            attributes: {
              position: this.regl.this('position'),
              normal: this.regl.this('normal')
            },
            elements: this.regl.this('elements'),
            frag: `
            precision mediump float;
          
            varying vec3 vNormal;
            varying vec3 vPosition;
          
            uniform float ambientLightAmount;
            uniform float diffuseLightAmount;
            uniform vec3 lightDir;
          
            uniform vec3 color;
          
            void main () {
              vec3 ambient = ambientLightAmount * color;
              float cosTheta = dot(vNormal, lightDir);
              vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
          
              gl_FragColor = vec4((ambient + diffuse), 1.0);
            }`,
            vert: `
            precision mediump float;
          
            attribute vec3 position;
            attribute vec3 normal;
          
            varying vec3 vPosition;
            varying vec3 vNormal;
          
            uniform mat4 projection, view, model;
          
            void main() {
              vec4 worldSpacePosition = model * vec4(position, 1);
          
              vPosition = worldSpacePosition.xyz;
              vNormal = normal;
          
              gl_Position = projection * view * worldSpacePosition;
            }`
        })

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
