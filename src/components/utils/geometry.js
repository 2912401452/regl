export function initPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    // https://github.com/mrdoob/three.js/blob/dev/src/geometries/PlaneGeometry.js
    const width_half = width / 2;
    const height_half = height / 2;

    const gridX = Math.floor( widthSegments );
    const gridY = Math.floor( heightSegments );

    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;

    const segment_width = width / gridX;
    const segment_height = height / gridY;

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for ( let iy = 0; iy < gridY1; iy ++ ) {

        const y = iy * segment_height - height_half;

        for ( let ix = 0; ix < gridX1; ix ++ ) {

            const x = ix * segment_width - width_half;

            vertices.push( x, - y, 0 );
            
            normals.push( 0, 0, 1 );

            uvs.push( ix / gridX );
            uvs.push( 1 - ( iy / gridY ) );

        }
    }

    for ( let iy = 0; iy < gridY; iy ++ ) {

        for ( let ix = 0; ix < gridX; ix ++ ) {

            const a = ix + gridX1 * iy;
            const b = ix + gridX1 * ( iy + 1 );
            const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
            const d = ( ix + 1 ) + gridX1 * iy;

            indices.push( a, b, d );
            indices.push( b, c, d );

        }
    }

    return { indices, vertices, normals, uvs }
}

export function initSphere(radius = 1, widthSegments = 32, heightSegments = 16) {
    const phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI;

    widthSegments = Math.max( 3, Math.floor( widthSegments ) );	
    heightSegments = Math.max( 2, Math.floor( heightSegments ) );

    const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

    let index = 0;
    const grid = [];

    const vertex = [];
    const normal = [];

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // generate vertices, normals and uvs

    for ( let iy = 0; iy <= heightSegments; iy ++ ) {

        const verticesRow = [];

        const v = iy / heightSegments;

        // special case for the poles

        let uOffset = 0;

        if ( iy == 0 && thetaStart == 0 ) {

            uOffset = 0.5 / widthSegments;

        } else if ( iy == heightSegments && thetaEnd == Math.PI ) {

            uOffset = - 0.5 / widthSegments;

        }

        for ( let ix = 0; ix <= widthSegments; ix ++ ) {

            const u = ix / widthSegments;

            // vertex

            vertex[0] = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
            vertex[1] = radius * Math.cos( thetaStart + v * thetaLength );
            vertex[2] = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

            vertices.push( vertex[0], vertex[1], vertex[2] );

            // normal
            normal[0] = vertex[0];
            normal[1] = vertex[1];
            normal[2] = vertex[2];
            // normalize(normal);
            normals.push( normal[0], normal[1], normal[2] );

            // uv

            uvs.push( u + uOffset, 1 - v );

            verticesRow.push( index ++ );

        }

        grid.push( verticesRow );

    }

    // indices

    for ( let iy = 0; iy < heightSegments; iy ++ ) {

        for ( let ix = 0; ix < widthSegments; ix ++ ) {

            const a = grid[ iy ][ ix + 1 ];
            const b = grid[ iy ][ ix ];
            const c = grid[ iy + 1 ][ ix ];
            const d = grid[ iy + 1 ][ ix + 1 ];

            if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
            if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

        }

    }

    return { indices, vertices, normals, uvs }
}

function  normalize(vec3) {
   const len = Math.sqrt(Math.pow(vec3[0], 2) + Math.pow(vec3[1], 2) + Math.pow(vec3[2], 2));
   vec3[0] /= len;
   vec3[1] /= len;
   vec3[2] /= len;
}

export function initSparks(radius = 1, widthSegments = 32, heightSegments = 16, count = 5) {
    const phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI;

    widthSegments = Math.max( 3, Math.floor( widthSegments ) );	
    heightSegments = Math.max( 2, Math.floor( heightSegments ) );

    const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

    let index = 0;
    const grid = [];

    const vertex = [];
    const normal = [];

    // buffers

    let indices = [];
    const vertices = [];
    const verticesOpacity = [];
    const normals = [];
    const uvs = [];

    let r = radius, opacity = 1;
    for(let icount = 0; icount < count;icount++) {
        // generate vertices, normals and uvs

        for ( let iy = 0; iy <= heightSegments; iy ++ ) {

            const verticesRow = [];

            const v = iy / heightSegments;

            // special case for the poles

            let uOffset = 0;

            if ( iy == 0 && thetaStart == 0 ) {

                uOffset = 0.5 / widthSegments;

            } else if ( iy == heightSegments && thetaEnd == Math.PI ) {

                uOffset = - 0.5 / widthSegments;

            }

            for ( let ix = 0; ix <= widthSegments; ix ++ ) {

                const u = ix / widthSegments;

                // vertex

                vertex[0] = - r * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                vertex[1] = r * Math.cos( thetaStart + v * thetaLength );
                vertex[2] = r * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                vertices.push( vertex[0], vertex[1], vertex[2] );
                verticesOpacity.push(opacity)

                // normal
                normal[0] = vertex[0];
                normal[1] = vertex[1];
                normal[2] = vertex[2];
                normals.push( normal[0], normal[1], normal[2] );

                // uv

                uvs.push( u + uOffset, 1 - v );

                verticesRow.push( index ++ );

            }

            grid.push( verticesRow );

        }

        // indices

        for ( let iy = 0; iy < heightSegments; iy ++ ) {

            for ( let ix = 0; ix < widthSegments; ix ++ ) {
                
                const a = grid[ iy ][ ix + 1 ];
                const b = grid[ iy ][ ix ];
                const c = grid[ iy + 1 ][ ix ];
                const d = grid[ iy + 1 ][ ix + 1 ];

                if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
                if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

            }

        }

        r *= 0.95;
        opacity *= 0.95;
    }

    // indices.length
    
    let len = indices.length/count;
    let step = indices[len-1] + 1

    let arr = []
    for(let i = 0; i < count;i++) {
        for(let j = 0;j < len;j++) {
            arr.push(indices[i * len + j] + i * step)
        }
    }
    indices = [...arr];

    return { indices, vertices, normals, uvs, verticesOpacity }
}