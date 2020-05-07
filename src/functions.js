export default getFragment

function getFragment () {
  return window.location.hash.substring(1)
}
