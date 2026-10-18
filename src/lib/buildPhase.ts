// Set only in the child process that runs next build. It must not be a public
// variable or next.config.env entry, which would bake it into runtime bundles.
export function isStaticBuild(): boolean {
  return process.env.VNDOCS_STATIC_BUILD === '1'
}
