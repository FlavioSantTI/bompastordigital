function calculateCRC16(str) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    
    for (let i = 0; i < str.length; i++) {
        let b = str.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            let bit = ((b >> (7 - j)) & 1) === 1;
            let c15 = ((crc >> 15) & 1) === 1;
            crc <<= 1;
            if (c15 !== bit) {
                crc ^= polynomial;
            }
        }
    }
    
    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

const input = '00020126440014BR.GOV.BCB.PIX0122grayceperini@gmail.com5204000053039865802BR5925Grayce Kelly Perini Gomes6009SAO PAULO621405103o0UGlysGH6304';
console.log('Calculated CRC16:', calculateCRC16(input));
console.log('Expected:', '9897');
