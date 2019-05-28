const { proxy } = require('@architect/shared')

const public = proxy.public({
	spa: true,
	plugins: {
		jsx: ['@architect/proxy-plugin-jsx/preact']
	}
})

exports.handler = async (req) =>
	public(req)
		.then(res => {
			if (res.headers['content-type'] === 'text/html; charset=utf-8')
				res.body = res.body.replace('_WS_URL_', 'ws://localhost:3333')
			return res
		})
