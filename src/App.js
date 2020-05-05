// IMPORTS
import { h, html, Component, render } from '../web_modules/spux.js'
import Nav from '../src/components/Nav.js'
import sha256 from '../web_modules/js-sha256.js'

// FUNCTIONS
function getFragment () {
  return window.location.hash.substring(1)
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
      timeTaken: 0,
      title: 'sha256'
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

    // benchmark
    var timeTaken = new Date().getTime() - startTime

    // update state
    this.setState({
      pw: pw,
      sha256: res,
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
        placeholder="sha256"
        class="card w-100"
        disabled
        value="${this.state.sha256}"
      />
    `

  // RENDER
  render (props, state) {
    return this.Main()
  }
}

render(h(App), document.body)
