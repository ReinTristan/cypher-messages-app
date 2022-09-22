const textArea = document.querySelector('#message')
const label = document.querySelector('#messageCountLabel')
textArea.addEventListener('input', (e) => {
	const target = e.target
	const maxLength = target.getAttribute('maxlength')
	const currentLength = target.value.length
	label.textContent = `${currentLength}/${maxLength}`
})

const inputFile = document.querySelector('#inputFile')
inputFile.addEventListener('change', loadMessage)

function loadMessage() {
	const fr = new FileReader()
	fr.addEventListener('load', () => {
		textArea.textContent = fr.result
	})
	fr.readAsText(this.files[0])
}
