// IMPORTS
import { h, html, Component, render } from '../web_modules/spux.js'
import Nav from '../src/components/Nav.js'
import sha256 from '../web_modules/js-sha256.js'
import store2 from '../web_modules/store2.js'
import getFragment from './functions.js'

// FUNCTIONS
// TODO #1: split out functions
// TODO #2 create functions.js

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
      target: store2('target'),
      suffix: store2('suffix')
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
      target: init.target,
      suffix: init.suffix
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
    var pw, prefix, target, suffix, test, keyPair

    if (e.target) {
      var name = e.target.name
    }

    if (name === 'suffix') {
      pw = this.state.pw
      prefix = this.state.prefix
      target = this.state.target
      suffix = event.target.value
      this.setState({ suffix: event.target.value })
    } else if (name === 'prefix') {
      pw = this.state.pw
      prefix = event.target.value
      target = this.state.target
      suffix = this.state.suffix
      this.setState({ prefix: event.target.value })
    } else if (name === 'target') {
      pw = this.state.pw
      prefix = this.state.prefix
      target = event.target.target
      suffix = this.state.suffix
      this.setState({ target: event.target.value })
      // } else if (name === 'pw') {
    } else {
      pw = event.target.value
      prefix = this.state.prefix
      target = this.state.target
      suffix = this.state.suffix
      this.setState({ pw: event.target.value })
    }

    // calculate sha256
    test = prefix + pw + suffix
    // console.log('prefix', prefix, 'pw', pw, 'suffix', suffix, 'test', test)
    var res = sha256(test)
    var sha256Bytes = hexToBytes(res)

    const s = suffix.split(',')
    s.forEach(element => {
      test = prefix + pw + element
      console.log(test)
      keyPair = getKeyPairFromPW(
        test,
        'uncompressed',
        this.state.publicKeyVersion
      )
      console.log(keyPair.publicKey.address.toString(), 'uncompressed')
      success(keyPair.publicKey.address.toString(), this.state.target)

      keyPair = getKeyPairFromPW(
        test,
        'compressed',
        this.state.publicKeyVersion
      )
      console.log(keyPair.publicKey.address.toString(), 'compressed')
      success(keyPair.publicKey.address.toString(), this.state.target)
    })

    store2('prefix', prefix)
    store2('target', target)
    store2('suffix', suffix)
    // benchmark
    var timeTaken = new Date().getTime() - startTime
    // console.log(
    //   'keyPair.publicKey.address.toString()',
    //   keyPair.publicKey.address.toString(),
    //   'this.state.target',
    //   this.state.target
    // )

    function success (a, b) {
      if (b.split(',').includes(a)) {
        alert('Success!', a, 'found!')
      }
    }

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
  // <${this.SuffixInput} />
  // <${this.Sha256Input} />
  // <${this.Sha256InputAsBytes} />
  // <${this.PrivateKeyInput} />
  // <${this.PublicKeyBytesInput} />
  // <${this.Ripe160Input} />

  Form = props =>
    html`
      <div class="row">
        <${this.PrefixInput} />
        <${this.PwInput} />
        <${this.SuffixInput} />
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
      />
    `
  }

  // passphrase input
  SuffixInput = () => {
    return html`
      <input
        placeholder="suffix"
        class="card w-100"
        value=${this.state.suffix}
        onInput=${this.handleChange}
        name="suffix"
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
