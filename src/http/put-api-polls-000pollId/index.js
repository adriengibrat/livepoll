const { json, save, prop, has } = require('@architect/shared')

exports.handler = async ({ body, params }) => {
	const key = prop(params, 'pollId')
	const exists = await has('polls', key)
	return await json(await save('polls', { ...body, ...key }), exists ? 200 : 201)
}
