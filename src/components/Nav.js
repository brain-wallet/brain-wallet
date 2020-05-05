// IMPORTS
import { h, html, Component, render } from '../../web_modules/spux.js'

// navbar
const Nav = props => {
  return html`
    <div class="bg-success white ph2 pv2 nav">
      <${NavItem} cols="1" text="${props.title}" />
    </div>
  `
}

// navbar item
const NavItem = props => html`
  <div class="col ${props.cols}">${props.text}</div>
`

export default Nav
