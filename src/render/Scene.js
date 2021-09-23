import REGL from 'regl'
import Mesh from './mesh'
const fit = require('canvas-fit')
const mat4 = require('gl-mat4')

class Scene {
    constructor(props) {
        this.props = props

        this.init()
    }

    init() {
        let { animate = false } = this.props

        this.initProperties()
        this.initCanvas()
        this.initCamera()

        this.regl = REGL({ // create enviromnent
            canvas: this.canvas,
            extensions: []
        })
 
       
        if(animate) {
            this.regl.frame(() => {
                this.renderFrame()

                this.camera.tick()
            })
        } else {
            this.renderFrame()
        }
    }

    /**
     * 初始化相机
     */
    initCamera() {
        /** camera
            [0, 10, 30] eye
            [0, 0, 0]   target
            [0, 1, 0]   up
         */
        this.camera = require('canvas-orbit-camera')(this.canvas)
        window.addEventListener('resize', fit(this.canvas), false)
    }

    initCanvas() {
        this.canvas = document.createElement('canvas')
        let wrap = document.getElementById(this.props.el)
        wrap.appendChild(this.canvas)
        fit(this.canvas)
    }

    /**
     * 初始化一些属性
     */
    initProperties() {
        this.clearColor = [0, 0, 0, 1]
        this.drawList = []
    }

    /**
     * 渲染连续帧
     */
    renderFrame() {
        this.regl.clear({
            color: this.clearColor,
            depth: 1
        })

        this.drawList.map(d => d.command())
    }

    /**
     * 往场景中增加添加网格对象
     * @param {*} mesh 
     */
    addMesh(mesh) {
        let drawMesh = this.regl(mesh)
        console.log('drawMesh', drawMesh)
        let drawObject = {
            drawID: '123',
            command: drawMesh
        }
        this.drawList.push(drawObject)
    }

    removeMesh() {
        console.log(this.drawList)
    }
}

export default Scene