import React from 'react'
import REGL from 'regl'

const mat4 = require('gl-mat4')
const vec3 = require('gl-vec3')
const fit = require('canvas-fit')
const bunny = require('bunny')
const normals = require('angle-normals')

var projectionMatrix = new Float32Array(16)

export default class Raycast extends React.Component {
    componentDidMount() {
        var iSelectedMesh = -1
        const canvas = this.el.appendChild(document.createElement('canvas'))
        fit(canvas)

        var mp = require('mouse-position')(canvas)
        var mb = require('mouse-pressed')(canvas)

        this.regl = REGL({ canvas: canvas, extensions: [] })
        this.regl.clear({ color: [0, 0, 0, 1] })

        const camera = require('canvas-orbit-camera')(canvas)
        camera.rotate([0.0, -0.2], [0.0, -0.6])
        camera.zoom(-20)

        window.addEventListener('resize', fit(canvas), false)

        const globalScope = this.regl({
            uniforms: {
                lightDir: [0.39, 0.87, 0.29],
                view: () => camera.view(),
                projection: ({ viewportWidth, viewportHeight }) =>
                    mat4.perspective(projectionMatrix, Math.PI / 4, viewportWidth / viewportHeight, 0.01, 1000)
            }
        })

        const drawNormal = this.regl({
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
            }`,
            frag: `
            precision mediump float;
          
            varying vec3 vNormal;
            varying vec3 vPosition;
          
            uniform float ambientLightAmount;
            uniform float diffuseLightAmount;
            uniform vec3 color;
            uniform vec3 lightDir;
          
            void main () {
              vec3 ambient = ambientLightAmount * color;
              float cosTheta = dot(vNormal, lightDir);
              vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
          
              gl_FragColor = vec4((ambient + diffuse), 1.0);
            }`
        })

        const drawOutline = this.regl({
            frag: `
            precision mediump float;
          
            void main () {
              gl_FragColor = vec4(vec3(0.7, 0.6, 0.0), 1.0);
            }`,
            vert: `
            precision mediump float;
          
            attribute vec3 position;
            attribute vec3 normal;
          
            uniform mat4 projection, view, model;
            uniform bool isRound;
          
            void main() {
              float s = 0.19;
              vec4 worldSpacePosition = model * vec4(
                // for objects with lots of jagged edges, the ususal approach doesn't work.
                // We use an alternative way of enlarging the object for such objects.
                isRound ? (position + normal * s) : (position * (0.3*s+1.0)),
                1);
              gl_Position = projection * view * worldSpacePosition;
            }`,
          
            depth: {
              enable: true,
              mask: false // DONT write to depth buffer!
            }
          })

        function Mesh (elements, position, normal) {
            this.elements = elements
            this.position = position
            this.normal = normal
        }

        function intersectTriangle (out, pt, dir, tri) {
            var EPSILON = 0.000001
            var edge1 = [0, 0, 0]
            var edge2 = [0, 0, 0]
            var tvec = [0, 0, 0]
            var pvec = [0, 0, 0]
            var qvec = [0, 0, 0]
          
            vec3.subtract(edge1, tri[1], tri[0])
            vec3.subtract(edge2, tri[2], tri[0])
          
            vec3.cross(pvec, dir, edge2)
            var det = vec3.dot(edge1, pvec)
          
            if (det < EPSILON) return null
            vec3.subtract(tvec, pt, tri[0])
            var u = vec3.dot(tvec, pvec)
            if (u < 0 || u > det) return null
            vec3.cross(qvec, tvec, edge1)
            var v = vec3.dot(dir, qvec)
            if (v < 0 || u + v > det) return null
          
            var t = vec3.dot(edge2, qvec) / det
            out[0] = pt[0] + t * dir[0]
            out[1] = pt[1] + t * dir[1]
            out[2] = pt[2] + t * dir[2]
            return t
        }
          
        function createModelMatrix (props) {
            var m = mat4.identity([])
          
            mat4.translate(m, m, props.translate)
          
            var s = props.scale
            mat4.scale(m, m, [s, s, s])
          
            return m
        }

        Mesh.prototype.draw = this.regl({
            uniforms: {
                model: (_, props, batchId) => {
                    return createModelMatrix(props)
                },
                ambientLightAmount: 0.3,
                diffuseLightAmount: 0.7,
                color: this.regl.prop('color'),
                isRound: this.regl.prop('isRound')
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
        
        var meshes = [
            { scale: 0.2, translate: [0.0, 0.0, 0.0], color: [0.6, 0.0, 0.0], mesh: bunnyMesh },
            { scale: 0.3, translate: [-6.0, 0.0, -3.0], color: [0.6, 0.6, 0.0], mesh: bunnyMesh },
            { scale: 0.16, translate: [3.0, 0.0, 2.0], color: [0.2, 0.5, 0.6], mesh: bunnyMesh },
        ]
        
        this.regl.frame(() => {
            this.regl.clear({
                color: [0, 0, 0, 255],
                depth: 1
            })

            globalScope(() => {
                var m
                for (var i = 0; i < meshes.length; i++) {
                  m = meshes[i]
                  if (i !== iSelectedMesh) {
                    // then draw object normally.
                    // eslint-disable-next-line no-loop-func
                    drawNormal(() => {
                      m.mesh.draw(m)
                    })
                  }
                }
            
                // we need to render the selected object last.
                if (iSelectedMesh !== -1) {
                  m = meshes[iSelectedMesh]
            
                  drawOutline(() => {
                    m.isRound = true
                    m.mesh.draw(m)
                  })
            
                  // then draw object normally.
                  drawNormal(() => {
                    m.mesh.draw(m)
                  })
                }
            })
      
            camera.tick()
        })
        mb.on('down', function () {
            var vp = mat4.multiply([], projectionMatrix, camera.view())
            var invVp = mat4.invert([], vp)
          
            // get a single point on the camera ray.
            // var rayPoint = vec3.transformMat4([], [2.0 * mp[0] / canvas.width - 1.0, -2.0 * mp[1] / canvas.height + 1.0, 0.0], invVp)
            var rayPoint = vec3.transformMat4([], [2.0 * mp.x / canvas.width - 1.0, -2.0 * mp.y / canvas.height + 1.0, 0.0], invVp)
            
            // get the position of the camera.
            var rayOrigin = vec3.transformMat4([], [0, 0, 0], mat4.invert([], camera.view()))
          
            var rayDir = vec3.normalize([], vec3.subtract([], rayPoint, rayOrigin))
          
            // now we iterate through all meshes, and find the closest mesh that intersects the camera ray.
            var minT = 10000000.0
            for (var i = 0; i < meshes.length; i++) {
                var m = meshes[i]
                var modelMatrix = createModelMatrix(m)
                for (var j = 0; j < m.mesh.elements.length; j++) {
                    var f = m.mesh.elements[j]
                    var tri = [
                            vec3.transformMat4([], m.mesh.position[f[0]], modelMatrix),
                            vec3.transformMat4([], m.mesh.position[f[1]], modelMatrix),
                            vec3.transformMat4([], m.mesh.position[f[2]], modelMatrix)
                        ]
                    var res = []
                    var t = intersectTriangle(res, rayPoint, rayDir, tri)
                    if (t !== null) {
                        if(t < minT) {
                            // mesh was closer than any object thus far.
                            // for the time being, make it the selected object.
                            minT = t
                            iSelectedMesh = i
                            break
                        }
                    }
                }
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
