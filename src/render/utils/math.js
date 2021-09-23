/**
 * 生成唯一的 uuid
 * @returns 
 */
const _lut = [];
function generateUUID() {
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	const uuid = _lut[ d0 & 0xff ] + _lut[ (d0 >> 8) & 0xff ] + _lut[ (d0 >> 16) & 0xff ] + _lut[ (d0 >> 240) & 0xff ] + '-' +
			_lut[ d1 & 0xff ] + _lut[ (d1 >> 8) & 0xff ] + '-' + _lut[ ((d1 >> 16) & 0x0f) | 0x40 ] + _lut[ (d1 >> 24) & 0xff ] + '-' +
			_lut[ (d2 & 0x3f) | 0x80 ] + _lut[ (d2 >> 8) & 0xff ] + '-' + _lut[ (d2 >> 16) & 0xff ] + _lut[ (d2 >> 24) & 0xff ] +
			_lut[ d3 & 0xff ] + _lut[ (d3 >> 8) & 0xff ] + _lut[ (d3 >> 16) & 0xff ] + _lut[ (d3 >> 24) & 0xff ];

	// .toUpperCase() here flattens concatenated strings to save heap memory space.
	return uuid.toUpperCase();

}

export default {
    generateUUID
}