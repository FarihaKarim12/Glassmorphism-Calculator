'use strict'

const state = {
	currentInput: '0',
	previousInput: '',
	operator: null,
	justEvaluated: false
}

const resultEl = document.getElementById('result')
const expressionEl = document.getElementById('expression')
const historyList = document.getElementById('historyList')
const historyEmpty = document.getElementById('historyEmpty')
const themeToggle = document.getElementById('themeToggle')
const toggleIcon = document.getElementById('toggleIcon')
const toggleLabel = document.getElementById('toggleLabel')
const clearHistBtn = document.getElementById('clearHistory')

let isDark = true

function toggleTheme(){
	isDark = !isDark
	document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
	toggleIcon.textContent = isDark ? '☀️' : '🌙'
	toggleLabel.textContent = isDark ? 'Light' : 'Dark'
}

themeToggle.addEventListener('click', toggleTheme)

function formatDisplay(numStr){
	const num = parseFloat(numStr)
	if(!isFinite(num)){
		return numStr
	}

	const precise = parseFloat(num.toPrecision(12))

	if(Math.abs(precise) >= 1e12 || (Math.abs(precise) < 1e-7 && precise !== 0)){
		return precise.toExponential(4)
	}

	const str = String(precise)
	const parts = str.split('.')

	if(parts[1] && parts[1].length > 8){
		return precise.toFixed(8).replace(/\.?0+$/, '')
	}

	return str
}

function updateDisplay(value, animate = false){
	resultEl.classList.remove('error', 'animate-pop')
	resultEl.textContent = value

	if(value.length > 12){
		resultEl.style.fontSize = '1.5rem'
	}
	else if(value.length > 8){
		resultEl.style.fontSize = '2rem'
	}
	else{
		resultEl.style.fontSize = ''
	}

	if(animate){
		void resultEl.offsetWidth
		resultEl.classList.add('animate-pop')
	}
}

function updateExpression(text){
	expressionEl.textContent = text || '\u00a0'
}

const OPS = { '+': '+', '−': '-', '×': '*', '÷': '/' }

function calculate(a, operator, b){
	const numA = parseFloat(a)
	const numB = parseFloat(b)

	if(operator === '÷' && numB === 0){
		return 'ERROR: ÷ by 0'
	}

	let result

	switch(operator){
		case '+':
			result = numA + numB
			break
		case '−':
			result = numA - numB
			break
		case '×':
			result = numA * numB
			break
		case '÷':
			result = numA / numB
			break
		default:
			return a
	}

	return formatDisplay(String(result))
}

function handleNumber(digit){
	if(state.justEvaluated){
		state.currentInput = digit
		state.justEvaluated = false
		updateExpression('')
	}
	else if(state.currentInput === '0' && digit !== '.'){
		state.currentInput = digit
	}
	else if(state.currentInput.length < 15){
		state.currentInput += digit
	}

	updateDisplay(state.currentInput)
}

function handleDecimal(){
	if(state.justEvaluated){
		state.currentInput = '0.'
		state.justEvaluated = false
		updateExpression('')
		updateDisplay(state.currentInput)
		return
	}

	if(!state.currentInput.includes('.')){
		state.currentInput += '.'
		updateDisplay(state.currentInput)
	}
}

function handleOperator(op){
	clearActiveOperator()

	if(state.operator && !state.justEvaluated){
		const result = calculate(state.previousInput, state.operator, state.currentInput)

		if(result.startsWith('ERROR')){
			showError(result)
			return
		}

		state.previousInput = result
		updateDisplay(result, true)
	}

	else if(!state.justEvaluated){
		state.previousInput = state.currentInput
	}

	state.operator = op
	state.justEvaluated = false

	state.currentInput = ''

	updateExpression(`${state.previousInput} ${op}`)

	const opBtns = document.querySelectorAll('.btn-op')
	opBtns.forEach(btn=>{
		if(btn.dataset.value === op){
			btn.classList.add('active-op')
		}
	})
}

function handleEquals(){
	if(!state.operator || state.justEvaluated){
		return
	}

	const expr = `${state.previousInput} ${state.operator} ${state.currentInput}`
	const result = calculate(state.previousInput, state.operator, state.currentInput)

	clearActiveOperator()

	if(result.startsWith('ERROR')){
		showError(result)
		updateExpression(expr)
		return
	}

	addHistory(expr, result)

	updateExpression(`${expr} =`)
	updateDisplay(result, true)

	state.currentInput = result
	state.previousInput = ''
	state.operator = null
	state.justEvaluated = true
}

function handleClear(){
	state.currentInput = '0'
	state.previousInput = ''
	state.operator = null
	state.justEvaluated = false

	clearActiveOperator()
	updateDisplay('0')
	updateExpression('')
}

function handleBackspace(){
	if(state.justEvaluated){
		return
	}

	if(state.currentInput.length <= 1 || state.currentInput === '-0'){
		state.currentInput = '0'
	}
	else{
		state.currentInput = state.currentInput.slice(0, -1)
	}

	updateDisplay(state.currentInput)
}

function handlePercent(){
	const num = parseFloat(state.currentInput)
	const pct = num / 100

	state.currentInput = formatDisplay(String(pct))
	state.justEvaluated = false

	updateDisplay(state.currentInput, true)
}

function handleSqrt(){
	const num = parseFloat(state.currentInput)

	if(num < 0){
		showError('ERROR: √ neg')
		return
	}

	const result = formatDisplay(String(Math.sqrt(num)))

	updateExpression(`√(${state.currentInput}) =`)
	updateDisplay(result, true)

	state.currentInput = result
	state.justEvaluated = true
	state.operator = null
}

function showError(msg){
	resultEl.classList.add('error')
	resultEl.textContent = msg
	resultEl.style.fontSize = ''

	setTimeout(()=>{
		handleClear()
	},2500)
}

function clearActiveOperator(){
	document.querySelectorAll('.btn-op').forEach(b=>{
		b.classList.remove('active-op')
	})
}

const MAX_HISTORY = 30
let historyItems = []

function addHistory(expression, result){
	historyItems.unshift({expression, result})

	if(historyItems.length > MAX_HISTORY){
		historyItems.pop()
	}

	renderHistory()
}

function renderHistory(){
	historyEmpty.style.display = historyItems.length === 0 ? 'flex' : 'none'

	const existing = historyList.querySelectorAll('.history-item')
	existing.forEach(el=>{
		el.remove()
	})

	historyItems.forEach((item, idx)=>{
		const div = document.createElement('div')

		div.className = 'history-item'
		div.setAttribute('role', 'button')
		div.setAttribute('tabindex', '0')
		div.setAttribute('aria-label', `${item.expression} equals ${item.result}. Click to reuse.`)

		div.innerHTML =`<div class="history-expr">${item.expression}</div>
		                <div class="history-val"><span>=</span>${item.result}</div>`

		div.addEventListener('click', ()=>{
			state.currentInput = item.result
			state.justEvaluated = true
			state.operator = null

			updateDisplay(item.result, true)
			updateExpression(item.expression)
		})

		div.addEventListener('keydown', e=>{
			if(e.key === 'Enter' || e.key === ' '){
				div.click()
			}
		})

		historyList.appendChild(div)
	})
}

clearHistBtn.addEventListener('click', ()=>{
	historyItems = []
	renderHistory()
})

renderHistory()

document.querySelectorAll('.btn').forEach(btn=>{
	btn.addEventListener('click', ()=>{
		const action = btn.dataset.action
		const value = btn.dataset.value

		switch(action){
			case 'number':
				handleNumber(value)
				break

			case 'operator':
				handleOperator(value)
				break

			case 'equals':
				handleEquals()
				break

			case 'clear':
				handleClear()
				break

			case 'decimal':
				handleDecimal()
				break

			case 'percent':
				handlePercent()
				break

			case 'sqrt':
				handleSqrt()
				break
		}
	})
})

const keyMap = {
	'0': ()=>handleNumber('0'),
	'1': ()=>handleNumber('1'),
	'2': ()=>handleNumber('2'),
	'3': ()=>handleNumber('3'),
	'4': ()=>handleNumber('4'),
	'5': ()=>handleNumber('5'),
	'6': ()=>handleNumber('6'),
	'7': ()=>handleNumber('7'),
	'8': ()=>handleNumber('8'),
	'9': ()=>handleNumber('9'),
	'.': ()=>handleDecimal(),
	',': ()=>handleDecimal(),
	'+': ()=>handleOperator('+'),
	'-': ()=>handleOperator('−'),
	'*': ()=>handleOperator('×'),
	'/': ()=>handleOperator('÷'),
	'Enter': ()=>handleEquals(),
	'=': ()=>handleEquals(),
	'Backspace': ()=>handleBackspace(),
	'Escape': ()=>handleClear(),
	'Delete': ()=>handleClear(),
	'%': ()=>handlePercent()
}

document.addEventListener('keydown', e=>{
	if(e.target === clearHistBtn || e.target === themeToggle){
		return
	}

	const handler = keyMap[e.key]

	if(handler){
		e.preventDefault()
		handler()
		flashButton(e.key)
	}
})

function flashButton(key){
	const keyToSelector = {
		'Enter': '[data-action="equals"]',
		'=': '[data-action="equals"]',
		'Escape': '[data-action="clear"]',
		'Delete': '[data-action="clear"]',
		'Backspace': null,
		'+': '[data-value="+"]',
		'-': '[data-value="−"]',
		'*': '[data-value="×"]',
		'/': '[data-value="÷"]',
		'%': '[data-action="percent"]'
	}

	let selector = keyToSelector[key]

	if(selector === undefined){
		if(/^[0-9]$/.test(key)){
			selector = `[data-value="${key}"]`
		}
		else if(key === '.' || key === ','){
			selector = '[data-action="decimal"]'
		}
	}

	if(!selector){
		return
	}

	const btn = document.querySelector(selector)

	if(!btn){
		return
	}

	btn.classList.add('active-op')
	btn.style.transform = 'scale(0.93)'

	setTimeout(()=>{
		btn.style.transform = ''

		if(!btn.classList.contains('btn-op') || btn.dataset.value !== state.operator){
			btn.classList.remove('active-op')
		}

	},150)
}

const kbHint = document.createElement('p')

document.querySelector('.calculator-card').appendChild(kbHint)