const { del, prop, has } = require('@architect/shared')

exports.handler = async ({ params }) => {
	const key = prop(params, 'pollId')
	if (!await has('polls', key)) return { status: 404 }
	await del('polls', key)
	return { status: 204 }
}
