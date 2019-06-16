/** @jsx h */
import { h, app } from 'https://unpkg.com/hyperapp@2.0.0-beta.13/src/index.js?module'

const update = (state, newState) => ({ ...state, ...newState })

const Check = ({ checked }) => 
	<div class="checkmark">
		<div class={ checked ? 'success' : null }>
			<span class="tip" />
			<span class="long" />
			<div class="circle" />
			<div class="fix" />
		</div>
	</div>

// Application bootstrap
app({
	init: () => [
		{},
		[ dispatch => {
			const ws = new WebSocket(WS_URL)
			Notification.requestPermission().then(console.log)
			new Notification('To do list', { body: 'text', requireInteraction: true, vibrate: true })
			ws.onopen = () => {
				// ws.send(JSON.stringify({ action: 'init', pollId: location.hash.replace(/^#/, '') }))
				ws.onmessage = ({ data }) => {
					dispatch(update, JSON.parse(data))
					// navigator.vibrate(200)
				}
			}
		} ],
	],
	view: state =>
		<main>
			{ !state.title ? <div class="wait"><span/></div> : '' }
			{ state.text ? <h2>{ state.text }</h2> : <h1>{ state.title }</h1> }
			
			<ol>{ state.options && state.options.map(({ text, checked }, index) => {
				return <li onclick={ state => (state.options[index].checked = true, { ...state }) }><Check checked={ checked } />{ text }</li>
			}) }</ol>
			
			{ state.connected ? <span class="connected">👪 <small>{ state.connected } connected people</small></span> : '' }

			<pre style={ { color: 'white' } }>{ JSON.stringify(state, null, 2) }</pre>
		</main>
	,
	node: document.getElementById('app')
})

// https://github.com/developit/snarkdown/blob/master/src/index.js