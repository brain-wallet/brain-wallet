/**
 * Hex to bytes
 *
 * @param {string} str A hex string
 * @returns {int[]} An array of bytes
 */
export function hexToBytes (str) {
  var result = []
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16))
    str = str.substring(2, str.length)
  }
  return result
}

export function getFragment () {
  return window.location.hash.substring(1)
}
