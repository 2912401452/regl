import React from 'react'
import Mesh from '../render/mesh'
import './style/index.css'

class Plane extends React.Component {
    constructor(props) {
        super(props)
        this.props = props
        this.addTrigngle = this.addTrigngle.bind(this)
        this.removeRandomTriangle = this.removeRandomTriangle.bind(this)
    }

    addTrigngle() {
        let { scene } = this.props.global
        let color = [Math.random(), Math.random(), Math.random(), 1]
        let position = [
            Math.random() * 20 - 10,
            Math.random() * 20 - 10,
            Math.random() * 20 - 10] 
        let points = [
            [-5, 0, 0],
            [0, -5, 0], 
            [5, 5, 0]
        ]
        
        let camera = scene.camera
        let triangle = Mesh.triangle({ camera, points, color, position })
        scene.addMesh(triangle)
    }

    removeRandomTriangle() {
        let { scene } = this.props.global
        console.log(scene.drawList)
        let meshID = scene.drawList[Math.floor(Math.random()*scene.drawList.length)]
        console.log('removeRandomTriangle', meshID)
        // scene.removeMesh()
    }

    render() {
        return <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            padding: '5px',
            background: '#fff',

            borderRadius: '10px',
            zIndex: 1
        }}>
            <button className='planeBtn' onClick={this.addTrigngle}>add trigngle</button>
            <button className='planeBtn' onClick={this.removeRandomTriangle}>remove random triangle</button>
        </div>
    }
}

export default Plane