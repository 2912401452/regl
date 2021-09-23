1. instance
    extensions: ['angle_instanced_arrays'] // ANGLE_instanced_arrays是属于 WebGL API 的一个扩展API，它允许多次绘制相同的对象或相似对象组，前提是它们共享相同的顶点数据、基本图形的个数和类型

    divisor: Number // 表示每个属性应用到几个实例上

    instances: Number // 表示当前有多少个实例对象

2. canvas-orbit-camera
    const camera = require('canvas-orbit-camera')(canvas)
        - camera = createCamera(canvas[, options])
        - The following options are available
            - rotate: disable rotation interactions by passing false.
            - scale: disable scaling interactions by passing false.
            - pan: disable panning interactions by passing false. 
                => ( const camera = require('canvas-orbit-camera')(canvas, { pan: false, scale: false }))

    camera.tick():
        Call this at the beginning of each frame to update the current position of the camera.

    camera.view([out])
        Returns the current view matrix associated by the camera: a 16-element (4x4) Float32Array instance. Optionally, you can pass in your own array out here too.

    camera attributes:
        center: Float32Array(3) - 记录相机的视点
        distance： Number - vec3.distance(eye, center)
        rotation: Float32Array(4) 

        => var proto = OrbitCamera.prototype // 原型链上的
            
            proto.lookAt = function(eye, center, up) {...}
