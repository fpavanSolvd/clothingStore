var crypto = require('crypto');

module.exports = function(key) {
	this.key = key;

	function encodeBase64(str) {
		return Buffer.from(str).toString('base64').toString('utf-8');
	}

	function decodeBase64(str) {
		return Buffer.from(str, 'base64').toString('utf-8');
	}

	function stringify(obj) {
		return JSON.stringify(obj);
	}

	function generateExpirationTime() {
		return Math.floor(Date.now() / 1000) + 3600;
	}

	function checkSumGen(head, body) {
		var checkSumStr = head + '.' + body;
		var hash = crypto.createHmac('sha256', key);
		var checkSum = hash.update(checkSumStr)
			.digest('base64').toString('utf8');
		return checkSum;
	}

	var alg = { 'alg': 'HS256', 'typ': 'JWT' };

	return {
		encode: (obj) => {
			obj.exp = generateExpirationTime();

			var result = '';
			var header = encodeBase64(stringify(alg));
			result += header + '.';
			var body = encodeBase64(stringify(obj));
			result += body + '.';

			var checkSum = checkSumGen(header, body);
			result += checkSum;
			return result;
		},
		decode: (str) => {
			var jwtArr = str.split('.');
			var head = jwtArr[0];
			var body = jwtArr[1];
			var hash = jwtArr[2];
			var checkSum = checkSumGen(head, body);

			if (hash === checkSum) {
				var payload = JSON.parse(decodeBase64(body));
				var currentTime = Math.floor(Date.now() / 1000);

				if (payload.exp && payload.exp > currentTime) {
					console.log('JWT hash: ' + hash);
					console.log('Generated hash: ' + checkSum);
					console.log('JWT was authenticated and has not expired');
					return payload;
				} else {
					console.log('JWT was not authenticated or has expired');
					console.log('JWT hash: ' + hash);
					console.log('Generated hash: ' + checkSum);
					return false;
				}
			} else {
				console.log('JWT was not authenticated');
				console.log('JWT hash: ' + hash);
				console.log('Generated hash: ' + checkSum);
				return false;
			}
		}
	};
};
