module.exports = {
  __esModule: true,
  default: (config) => (request) => {
    return new Response(null, { status: 200 })
  }
}