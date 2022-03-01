import React from 'react'
import REGL from 'regl'
import { identity, rotateY, rotateZ } from 'gl-mat4'
import { scale, transformMat4, normalize } from 'gl-vec3'
import img from "./assets/world.jpeg"

const bunny = require('bunny')
// import img from './assets/world.jpeg'


var matRotY = identity([])
var matRotZ = identity([])
var up = [0, 1, 0]
var tmpVec3 = [0, 0, 0]

function primitiveSphere (radius, opt) {
  opt = opt || {}
  radius = typeof radius !== 'undefined' ? radius : 1
  var segments = typeof opt.segments !== 'undefined' ? opt.segments : 32

  var totalZRotationSteps = 2 + segments
  var totalYRotationSteps = 2 * totalZRotationSteps

  var indices = []
  var positions = []
  var normals = []
  var uvs = []

  for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
    var normalizedZ = zRotationStep / totalZRotationSteps
    var angleZ = (normalizedZ * Math.PI)

    for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
      var normalizedY = yRotationStep / totalYRotationSteps
      var angleY = normalizedY * Math.PI * 2

      identity(matRotZ)
      rotateZ(matRotZ, matRotZ, -angleZ)

      identity(matRotY)
      rotateY(matRotY, matRotY, angleY)

      transformMat4(tmpVec3, up, matRotZ)
      transformMat4(tmpVec3, tmpVec3, matRotY)

      scale(tmpVec3, tmpVec3, -radius)
      positions.push(tmpVec3.slice())

      normalize(tmpVec3, tmpVec3)
      normals.push(tmpVec3.slice())

      uvs.push([ normalizedY, 1 - normalizedZ ])
    }

    

    if (zRotationStep > 0) {
      var verticesCount = positions.length
      var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1)
      for (; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
        indices.push([
          firstIndex,
          firstIndex + 1,
          firstIndex + totalYRotationSteps + 1
        ])
        indices.push([
          firstIndex + totalYRotationSteps + 1,
          firstIndex + 1,
          firstIndex + totalYRotationSteps + 2
        ])
      }
    }
  }

  return {
    cells: indices,
    positions: positions,
    normals: normals,
    uvs: uvs
  }
}


const createCamera = require('./utils/camera')
 export default class Geomorph extends React.Component {
    componentDidMount() {
      this.regl = REGL("#index") // 构建 fullScreen Canvas 返回对应的上下文对象
      this.regl.clear({
          color: [0, 0, 0, 1]
      })

      var mesh = primitiveSphere(4.0, { segments: 32 })

      const draw = this.regl({
        vert: `
        precision mediump float;
        attribute vec3 a_position;
        attribute vec2 a_uv;
        uniform mat4 view, projection;

        varying vec2 v_uv;
        void main () {
          v_uv = a_uv;
          gl_Position = projection * view * vec4(a_position, 1);
        }`,

        frag: `
        precision mediump float;
        varying vec2 v_uv;
        uniform sampler2D tex;
        void main() {
          // gl_FragColor = vec4(v_uv, 0, 1);
          gl_FragColor = texture2D(tex, v_uv);
          // gl_FragColor = vec4(1, 1, 0, 1);
        }`,
        attributes: {
          a_position: mesh.positions,
          a_uv: mesh.uvs
        },
        elements: mesh.cells,
        uniforms: {
          tex: this.regl.prop('texture')
        },
      })

      this.camera = createCamera(this.regl, {
          center: [10, 2, 0]
      })

      // this.regl.frame(() => {
      //     this.regl.clear({
      //       depth: 1,
      //       color: [0, 0, 0, 1]
      //     })
      //     this.camera(() => {
      //       draw({
      //         lod: 0
      //       })
      //     })
      // })
      require("resl")({
        manifest: {
            texture: {
                type: 'image',
                src: img,
                // src: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fhf.web.tedu.cn%2Fupload%2F20170608%2F20170608135206_259.jpg&refer=http%3A%2F%2Fhf.web.tedu.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1619532256&t=3704ff2b8a366c059054d16a06e08c79',
                parser: (data) => {
                    console.log(data)
                    return this.regl.texture({
                        data: data,
                        mag: 'linear',
                        min: 'linear'
                    })
                }
            }
        },
        onDone: ({ texture }) => {
            this.regl.frame(() => {
                this.regl.clear({
                  color: [0, 0, 0, 255],
                  depth: 1
                })
                // draw({ texture })
                      this.camera(() => {
                      draw({
                        texture
                      })
                    })
            })
        },
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
