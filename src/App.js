// IMPORTS
import { h, html, Component, render } from '../web_modules/spux.js'
import Nav from '../src/components/Nav.js'
import sha256 from '../web_modules/js-sha256.js'

// FUNCTIONS
function getFragment () {
  return window.location.hash.substring(1)
}
/**
 * Hex to bytes
 *
 * @param {string} str A hex string
 * @returns {int[]} An array of bytes
 */
function hexToBytes (str) {
  var result = []
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16))
    str = str.substring(2, str.length)
  }
  return result
}

// APP
class App extends Component {
  // INIT STATE
  constructor (props) {
    super(props)
    let hash = getFragment()
    let init = {
      pw: hash,
      sha256: hash ? sha256(hash) : ''
    }
    this.state = {
      pw: init.pw,
      sha256: init.sha256,
      sha256Bytes: [],
      timeTaken: 0,
      title: 'Brain Wallet'
    }
    this.handleChange = this.handleChange.bind(this)
  }

  // EVENTS
  /**
   * handle all form changes
   *
   * @param {*} e
   * @memberof Body
   */
  handleChange (e) {
    // start time
    let startTime = new Date().getTime()

    // calculate sha256
    let pw = event.target.value
    var res = sha256(pw)
    var sha256Bytes = hexToBytes(res)

    // benchmark
    var timeTaken = new Date().getTime() - startTime

    // update state
    this.setState({
      pw: pw,
      sha256: res,
      sha256Bytes: sha256Bytes,
      timeTaken: timeTaken
    })
  }

  // COMPONENTS
  // Main app
  Main = () => {
    return html`
      <div><${Nav} title="${this.state.title}" /><${this.Form} /></div>
    `
  }

  // form
  Form = props =>
    html`
      <div class="row">
        <${this.PwInput} />
        <${this.Sha256Input} />
        <${this.Sha256InputAsBytes} />
        <br />
        <sub>${'Time: ' + this.state.timeTaken + 'ms'}</sub>
      </div>
    `

  // passphrase input
  PwInput = () => {
    return html`
      <input
        placeholder="passphrase"
        class="card w-100"
        autofocus="true"
        value=${this.state.pw}
        onInput=${this.handleChange}
        key="PwInput"
      />
    `
  }

  // sha 256 input
  Sha256Input = () =>
    html`
      <input
        placeholder="secret exponent (sha256)"
        class="card w-100"
        disabled
        value="${this.state.sha256}"
      />
    `

  // sha 256 input
  Sha256InputAsBytes = () =>
    html`
      <input
        placeholder="secret exponent as bytes (sha256)"
        class="card w-100"
        disabled
        value="${this.state.sha256Bytes}"
      />
    `

  // RENDER
  render (props, state) {
    return this.Main()
  }
}

render(h(App), document.body)
