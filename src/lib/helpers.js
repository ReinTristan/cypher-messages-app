const primeDivisor = 131

const helpers = {}
function addmod(x, y, n) {
	if (x + y <= x) x = x - ((n - y) % n)
	else x = (x + y) % n
	return x
}

function sqrmod(a, n) {
	let b
	let sum = 0
	a = a % n
	for (b = a; b != 0; b >>= 1) {
		if (b & 1) {
			sum = addmod(sum, a, n)
		}
		a = addmod(a, a, n)
	}
	return sum
}

function powFun(base, ex, mo) {
	let r
	if (ex === 0) return 1
	else if (ex % 2 === 0) {
		r = powFun(base, ex / 2, mo) % mo
		// return (r * r) % mo;
		return sqrmod(r, mo)
	} else return (base * powFun(base, ex - 1, mo)) % mo
}

helpers.generateKeys = (senderPrime, receiverPrime) => {
	const keys = {}
	const gValue = getRandomIntOdd(2, 200)
	const publicKeyA = powFun(gValue, senderPrime, primeDivisor)
	const publicKeyB = powFun(gValue, receiverPrime, primeDivisor)
	const privateKeyA = powFun(gValue, publicKeyB, primeDivisor)
	const privateKeyB = powFun(gValue, publicKeyA, primeDivisor)

	keys.senderKey = privateKeyA
	keys.receiverKey = privateKeyB
	return keys
}

const cipherEcuation = ({ code, key, primeDivisor }) =>
	((code + key ** 2) % primeDivisor) + 1

const decipherEcuation = ({ code, key, primeDivisor }) => {
	let decipherDividend = -1 + (code - key ** 2)
	return mod(decipherDividend, primeDivisor)
}
function mod(n, m) {
	return ((n % m) + m) % m
}
helpers.cipherMessage = (message, key) => {
	const originalMessageArray = Array.from(message)

	const originalMessageCodes = originalMessageArray.map((char) =>
		char.codePointAt()
	)

	const cipherMessageCodes = originalMessageCodes.map((code) => {
		return cipherEcuation({ code, key, primeDivisor })
	})
	const cipherVersion = cipherMessageCodes.join(',')

	return cipherVersion
}

helpers.decipherMessage = (message, key) => {
	const cipherMessageArray = message.split(',')

	const decipherMessageCodes = cipherMessageArray.map((code) => {
		return decipherEcuation({ code, key, primeDivisor })
	})

	const decipherMessageArray = decipherMessageCodes.map((code) => {
		return String.fromCodePoint(code)
	})

	const decipherVersion = decipherMessageArray.join('')

	return decipherVersion
}

helpers.generatePrime = () => {
	let number = 0
	while (!isPrime(number)) {
		number = getRandomIntOdd(2, 1000)
	}
	return number
}

function isPrime(n) {
	if (isNaN(n) || !isFinite(n) || n % 1 || n < 2) return false
	if (n % 2 == 0) return n == 2
	let m = Math.sqrt(n)
	for (let i = 3; i <= m; i += 2) {
		if (n % i == 0) return false
	}
	return true
}

function getRandomIntOdd(min, max) {
	let randomNumber = Math.floor(Math.random() * (max - min)) + min
	if (randomNumber % 2 == 0) return randomNumber + 1
	return randomNumber
}

const dateUnits = {
	day: 86400,
	hour: 3600,
	minute: 60,
	second: 1,
}
const getSecondsDiff = (timeStamp) => (Date.now() - timeStamp) / 1000

function getUnitAndValue(secondsElapsed) {
	for (const [unit, secondsInUnits] of Object.entries(dateUnits)) {
		if (secondsElapsed >= secondsInUnits || unit === 'second') {
			const value = Math.floor(secondsElapsed / secondsInUnits) * -1
			return { unit, value }
		}
	}
}

helpers.timeAgo = (timeStamp) => {
	const rtf = new Intl.RelativeTimeFormat('en')
	const secondsElapsed = getSecondsDiff(timeStamp)
	const { value, unit } = getUnitAndValue(secondsElapsed)
	return rtf.format(value, unit)
}

helpers.cipherPassword = (password, prime) => {
	const gValue = Array.from(prime.toString()).reduce(
		(acc, value) => acc + value
	)
	const key = powFun(gValue, prime, primeDivisor)

	const passwordArray = Array.from(password.toString())
	const passwordCodes = passwordArray.map((char) => char.codePointAt(0))
	const cipherPasswordArray = passwordCodes.map((code) =>
		cipherEcuation({ code, key, primeDivisor })
	)
	const cipherPassword = cipherPasswordArray.join(',')
	return cipherPassword
}

module.exports = helpers
