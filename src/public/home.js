Array.from(document.querySelectorAll('.status-option'), (el) => {
  el.addEventListener('click', async (ev) => {
    setError('')

    if (el.dataset.authed !== '1') {
      window.location = '/login'
      return
    }

    const res = await fetch('/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: el.dataset.value }),
    })
    const body = await res.json()
    if (body?.error) {
      setError(body.error)
    } else {
      location.reload()
    }
  })
})

function setError(str) {
  const errMsg = document.querySelector('.error')
  if (str) {
    errMsg.classList.add('visible')
    errMsg.textContent = str
  } else {
    errMsg.classList.remove('visible')
  }
}
