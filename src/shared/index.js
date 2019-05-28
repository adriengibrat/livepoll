const data = require('@architect/data')
// const Hashids = require('hashids')
const { proxy, ws } = require('@architect/functions')

exports.proxy = proxy
exports.ws = ws



// exports.hashId = ({ id = Date.now() - 1525066366572, seed = '', padding = 5 } = {}) =>
// 	new Hashids(seed, padding).encode(id)

exports.prop = (hash, name) => {
	if (hash[name] === undefined)
		throw Error(`missing '${name}'`)
	return { [name]: hash[name] }
}

const clean = object => {
	const cleaned = {}
	for (let property in object)
		if (object[property] !== '') // see https://github.com/aws/aws-sdk-js/issues/833
			cleaned[property] = object[property]
	return cleaned
}

exports.save = async (table, row) => data[table].put(clean(row))

exports.del = async (table, key, { scan = false } = {}) => {
	scan ?
		(await exports.query(table, key, { scan })).Items.forEach(item => data[table].delete(item)) :
		data[table].delete(key)
}

exports.has = async (table, key) => data[table].get(key)

exports.query = async (table, key, { scan = !key } = {}) => {
	const expression = h => Object.keys(h).map(k => `${k} = :${k}`).join(' AND ')
	const values = h => Object.keys(h).reduce((e, k) => Object.assign(e, { [`:${k}`]: h[k] }), {})
	return scan ? 
		data[table].scan(key ? { FilterExpression: expression(key), ExpressionAttributeValues: values(key) } : {}) :
		data[table].query({ KeyConditionExpression: expression(key), ExpressionAttributeValues: values(key) })
}

exports.json = (payload, status = payload == null ? 404 : 200) => ({
	status,
	type: 'application/json',
	body: JSON.stringify(payload)
})