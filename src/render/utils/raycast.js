const vec3 = require('gl-vec3')

function ray(params) {
    
}

function rayIntersect(ray, objects) {
    
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