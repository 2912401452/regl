import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')
var SHADOW_RES = 1024

const planeElements = []
var planePosition = []
var planeNormal = []

planePosition.push([-0.5, 0.0, -0.5])
planePosition.push([+0.5, 0.0, -0.5])
planePosition.push([-0.5, 0.0, +0.5])
planePosition.push([+0.5, 0.0, +0.5])

planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])
planeNormal.push([0.0, 1.0, 0.0])

planeElements.push([3, 1, 0])
planeElements.push([0, 2, 3])

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



 export default class Shadow extends React.Component {
    componentDidMount() {

        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)
        this.regl = REGL({ canvas: canvas, extensions: ['oes_texture_float'] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const fbo = this.regl.framebuffer({
            color: this.regl.texture({
              width: SHADOW_RES,
              height: SHADOW_RES,
              wrap: 'clamp',
              type: 'float'
            }),
            depth: true
        })

        const camera = require('canvas-orbit-camera')(canvas)
        camera.rotate([0.0, 0.0], [0.0, -0.4])
        // camera.zoom(-30.0)
        window.addEventListener('resize', fit(canvas), false)

        const globalScope = this.regl({
            context: {
              lightDir: [0.39, 0.87, 0.29]
            },
            uniforms: {
              lightDir: this.regl.context('lightDir'),
              lightView: (context) => {
                return mat4.lookAt([], context.lightDir, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0])
              },
              lightProjection: mat4.ortho([], -25, 25, -20, 20, -25, 25)
            }
        })

        const drawDepth = this.regl({
            vert: `
            precision mediump float;
            attribute vec3 position;
            uniform mat4 lightProjection, lightView, model;
            varying vec3 vPosition;
            void main() {
                vec4 p = lightProjection * lightView * model * vec4(position, 1.0);
                gl_Position = p;
                vPosition = p.xyz;
            }`,
            frag: `
            precision mediump float;
            varying vec3 vPosition;
            void main () {
                gl_FragColor = vec4(vec3(vPosition.z), 1.0);
            }`,
            framebuffer: fbo
        })

        const drawNormal = this.regl({
            vert: `
            precision mediump float;

            attribute vec3 position;
            attribute vec3 normal;

            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vShadowCoord;

            uniform mat4 projection, view, model;
            uniform mat4 lightProjection, lightView;

            void main() {
                vPosition = position;
                vNormal = normal;

                vec4 worldSpacePosition = model * vec4(position, 1); // 计算世界坐标
                gl_Position = projection * view * worldSpacePosition;
                vShadowCoord = (lightProjection * lightView * worldSpacePosition).xyz; // 计算世界坐标以光源作为观察点计算出来的阴影坐标
                // 此时的阴影坐标已经被归一化到标准坐标系 => [-1, 1]
            }`,
            frag: `
            precision mediump float;
          
            varying vec3 vNormal;
            varying vec3 vShadowCoord;
          
            uniform float ambientLightAmount;
            uniform float diffuseLightAmount;
            uniform vec3 color;
            uniform sampler2D shadowMap; // 阴影贴图
            uniform vec3 lightDir;
          
            uniform float minBias;
            uniform float maxBias;
          
          #define texelSize 1.0 / float(${SHADOW_RES})
          
            float shadowSample(vec2 co, float z, float bias) {
              float a = texture2D(shadowMap, co).z; // 阴影贴图中的深度值
              float b = vShadowCoord.z; // 当前片元以光源观察信息计算出的深度值
              return step(b-bias, a); // bias - 偏移
            }
          
            void main () {
                vec3 ambient = ambientLightAmount * color;
                float cosTheta = dot(vNormal, lightDir);
                vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
            
                float v = 1.0; // shadow value
                vec2 co = vShadowCoord.xy * 0.5 + 0.5;// go from range [-1,+1] to range [0,+1]
            
                // counteract shadow acne.
                float bias = max(maxBias * (1.0 - cosTheta), minBias);
            
                float v0 = shadowSample(co + texelSize * vec2(0.0, 0.0), vShadowCoord.z, bias);
                float v1 = shadowSample(co + texelSize * vec2(1.0, 0.0), vShadowCoord.z, bias);
                float v2 = shadowSample(co + texelSize * vec2(0.0, 1.0), vShadowCoord.z, bias);
                float v3 = shadowSample(co + texelSize * vec2(1.0, 1.0), vShadowCoord.z, bias);

                // float v0 = shadowSample(co , vShadowCoord.z, bias);
                // float v1 = shadowSample(co , vShadowCoord.z, bias);
                // float v2 = shadowSample(co , vShadowCoord.z, bias);
                // float v3 = shadowSample(co , vShadowCoord.z, bias);
            
                // PCF filtering - 柔化阴影（由于在深度计算的缘故、若是不进行偏移做模糊处理就会有很明显的锯齿）
                v = (v0 + v1 + v2 + v3) * (1.0 / 4.0);
            
                // if outside light frustum, render now shadow.
                // If WebGL had GL_CLAMP_TO_BORDER we would not have to do this,
                // but that is unfortunately not the case...
                if(co.x < 0.0 || co.x > 1.0 || co.y < 0.0 || co.y > 1.0) {
                    v = 1.0;
                }
            
                gl_FragColor = vec4((ambient + diffuse * v), 1.0); // 哪怕在光源被遮挡的部分依旧会存在环境光
            }`,
            uniforms: {
                view: () => camera.view(),
                projection: ({ viewportWidth, viewportHeight }) =>
                  mat4.perspective([],
                    Math.PI / 4,
                    viewportWidth / viewportHeight,
                    0.01,
                    2000),
                shadowMap: fbo,
                minBias: () => 0.005,
                maxBias: () => 0.03
            },
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
          
                mat4.translate(m, m, props.translate)
          
                var s = props.scale
                mat4.scale(m, m, [s, s, s])
                return m
              },
              ambientLightAmount: 0.3,
              diffuseLightAmount: 0.7,
              color: this.regl.prop('color')
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
        var boxMesh = new Mesh(boxElements, boxPosition, boxNormal)
        var planeMesh = new Mesh(planeElements, planePosition, planeNormal)

      
        
        this.regl.frame(({tick}) => {
         
            var drawMeshes = () => {
                this.regl.clear({
                    color: [0, 0, 0, 255],
                    depth: 1
                })

                var t = tick * 0.02
                var r = 8.0
                var bp1 = [r * Math.sin(t), 3.3, r * Math.cos(t)]

                boxMesh.draw({ scale: 4.2, translate: [0.0, 9.0, 0], color: [0.05, 0.5, 0.5] })
                planeMesh.draw({ scale: 80.0, translate: [0.0, 0.0, 0.0], color: [1.0, 1.0, 1.0] })
                bunnyMesh.draw({ scale: 0.7, translate: bp1, color: [0.55, 0.2, 0.05] })
            }
            
            globalScope(() => {
                drawDepth(drawMeshes)
                drawNormal(drawMeshes)
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
