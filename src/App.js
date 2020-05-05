// IMPORTS
import { h, html, Component, render } from '../web_modules/spux.js'
import Nav from '../src/components/Nav.js'
import sha256 from '../web_modules/js-sha256.js'
import store2 from '../web_modules/store2.js'

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

/**
 * Get encoded point
 *
 * @param {*} pt
 * @param {*} compressed
 * @returns {int[]} Array of bytes
 */
function getEncoded (pt, compressed) {
  var x = pt.getX().toBigInteger()
  var y = pt.getY().toBigInteger()
  var enc = integerToBytes(x, 32)
  if (compressed) {
    if (y.isEven()) {
      enc.unshift(0x02)
    } else {
      enc.unshift(0x03)
    }
  } else {
    enc.unshift(0x04)
    enc = enc.concat(integerToBytes(y, 32))
  }
  return enc
}

/**
 * Get an EC Key from hash
 *
 * @param {string} hash
 * @returns ECKey
 */
function getECKeyFromHash (hash) {
  var eckey = new Bitcoin.ECKey(hexToBytes(hash))
  return eckey
}

/**
 * Get a private key address form hash
 *
 * @param {string} hash A hash
 * @param {string} addressType A string of compressed or uncompressed
 * @param {string} publicKeyVersion Version number of the public key
 * @returns {Bitcoin.Address} A bitcoin private key address
 */
function getPrivateKeyAddressFromHash (hash, addressType, publicKeyVersion) {
  const OFFSET = 128
  var payload = hexToBytes(hash)
  if (addressType === 'compressed') {
    payload.push(0x01)
  }
  var sec = new Bitcoin.Address(payload)
  sec.version = parseInt(publicKeyVersion) + OFFSET
  return sec
}

/**
 * Get public key from private
 *
 * @param {*} eckey
 * @param {*} addressType
 * @param {*} publicKeyVersion
 * @returns {Bitcoin.Address} A bticoin public key address
 */
function getPublicKeyFromPrivate (eckey, addressType, publicKeyVersion) {
  var curve = getSECCurveByName('secp256k1')
  var publicKey = {}
  var genPt = curve.getG().multiply(eckey.priv)
  if (addressType === 'uncompressed') {
    publicKey.pub = getEncoded(genPt, false)
  } else {
    publicKey.pub = getEncoded(genPt, true)
  }

  // get pub key hash
  publicKey.ripe160 = Bitcoin.Util.sha256ripe160(publicKey.pub)

  // get pub key address
  var address = new Bitcoin.Address(publicKey.ripe160)
  address.version = parseInt(publicKeyVersion)
  publicKey.address = address
  return publicKey
}

/**
 * Gets a key pair from a hash
 *
 * @param {*} hash
 * @param {*} addressType
 * @param {*} publicKeyVersion
 * @returns {*} A keypair
 */
function getKeyPairFromHash (hash, addressType, publicKeyVersion) {
  var keyPair = {}
  keyPair.hash = hash
  // get privkey from hash
  keyPair.privateKey = getECKeyFromHash(hash)

  // get privateKey address
  keyPair.privateKeyAddress = getPrivateKeyAddressFromHash(
    hash,
    addressType,
    publicKeyVersion
  )

  // get pub key from private
  keyPair.publicKey = getPublicKeyFromPrivate(
    keyPair.privateKey,
    addressType,
    publicKeyVersion
  )

  return keyPair
}

/**
 * Gets a key pair from a string using sha245 KDF
 *
 * @param {*} pw
 * @param {*} addressType
 * @param {*} publicKeyVersion
 * @returns {*} A key pair
 */
function getKeyPairFromPW (pw, addressType, publicKeyVersion) {
  var hash = sha256(pw, addressType, publicKeyVersion)
  var keyPair = getKeyPairFromHash(hash, addressType, publicKeyVersion)
  return keyPair
}

// APP
class App extends Component {
  // INIT STATE
  constructor (props) {
    super(props)
    let hash = getFragment()
    let init = {
      pw: hash,
      sha256: hash ? sha256(hash) : '',
      prefix: store2('prefix'),
      target: store2('target')
    }
    this.state = {
      prefix: init.prefix,
      pw: init.pw,
      sha256: init.sha256,
      sha256Bytes: [],
      privateKey: '',
      timeTaken: 0,
      eckey: {},
      addressType: 'uncompressed',
      publicKeyVersion: 0,
      title: 'Brain Wallet',
      target: init.target
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
    var pw, prefix, target

    if (e.target) {
      var name = e.target.name
    }

    if (name === 'pw') {
      pw = event.target.value
      prefix = this.state.prefix
      target = this.state.target
      this.setState({ pw: event.target.value })
    } else if (name === 'prefix') {
      pw = this.state.pw
      prefix = event.target.value
      target = this.state.target
      this.setState({ prefix: event.target.value })
    } else if (name === 'target') {
      pw = this.state.pw
      prefix = this.state.prefix
      target = event.target.target
      this.setState({ target: event.target.value })
    }

    // calculate sha256
    var res = sha256(prefix + pw)
    var sha256Bytes = hexToBytes(res)

    var keyPair = getKeyPairFromPW(
      pw,
      this.state.addressType,
      this.state.publicKeyVersion
    )

    store2('prefix', this.state.prefix)
    store2('target', this.state.target)
    // benchmark
    var timeTaken = new Date().getTime() - startTime

    // update state
    this.setState({
      prefix: prefix,
      pw: pw,
      sha256: res,
      sha256Bytes: sha256Bytes,
      sha256: keyPair.hash,

      privateKeyInt: keyPair.privateKey.priv,
      privateKeyAddress: keyPair.privateKeyAddress,

      publicKeyBytes: keyPair.publicKey.pub,
      ripe160: keyPair.publicKey.ripe160,
      publicKeyAddress: keyPair.publicKey.address,

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
        <${this.PrefixInput} />
        <${this.PwInput} />
        <${this.Sha256Input} />
        <${this.Sha256InputAsBytes} />
        <${this.PrivateKeyInput} />
        <${this.PublicKeyBytesInput} />
        <${this.Ripe160Input} />
        <${this.PublicKeyAddressInput} />
        <${this.TargetInput} />
        <br />
        <sub>${'Time: ' + this.state.timeTaken + 'ms'}</sub>
      </div>
    `

  // prefix input
  PrefixInput = () => {
    return html`
      <input
        placeholder="prefix"
        class="card w-100"
        value=${this.state.prefix}
        onInput=${this.handleChange}
        name="prefix"
      />
    `
  }

  // passphrase input
  PwInput = () => {
    return html`
      <input
        placeholder="passphrase"
        class="card w-100"
        autofocus="true"
        value=${this.state.pw}
        onInput=${this.handleChange}
        name="pw"
      />
    `
  }

  // target input
  TargetInput = () => {
    return html`
      <input
        placeholder="target"
        class="card w-100"
        autofocus="true"
        value=${this.state.target}
        onInput=${this.handleChange}
        name="target"
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

  // sha 256 as bytes input
  Sha256InputAsBytes = () =>
    html`
      <input
        placeholder="secret exponent as bytes (sha256)"
        class="card w-100"
        disabled
        value="${this.state.sha256Bytes}"
      />
    `

  // private key input
  PrivateKeyInput = () =>
    html`
      <input
        placeholder="Private Key Base58 check Address"
        class="card w-100"
        disabled
        value="${this.state.privateKeyAddress}"
      />
    `

  // public key as bytes input
  PublicKeyBytesInput = () =>
    html`
      <input
        placeholder="ECDSA Public Key as Bytes"
        class="card w-100"
        disabled
        value="${this.state.publicKeyBytes}"
      />
    `
  // ripe 160 input
  Ripe160Input = () =>
    html`
      <input
        placeholder="Ripe 160 hash of Public Key as Bytes"
        class="card w-100"
        disabled
        value="${this.state.ripe160}"
      />
    `

  // public key address input
  PublicKeyAddressInput = () =>
    html`
      <input
        placeholder="Public Key Base58 check Address"
        class="card w-100"
        disabled
        value="${this.state.publicKeyAddress}"
      />
    `

  // RENDER
  render (props, state) {
    return this.Main()
  }
}

render(h(App), document.body)
