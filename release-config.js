/**
 * Public installer repo — landing download buttons and scripts.js read this.
 * CI updates landing/downloads.json on each tagged release.
 */
window.GLITCHHUB_RELEASE = {
    repo: 'Nishanth-Kata/GlitchHub',
    winAsset: 'GlitchHub-Setup-win.exe',
    macAsset: 'GlitchHub-mac-arm64.dmg',
    /** Used when GitHub API is unavailable; must match a release that has both assets */
    fallbackTag: 'v3.0.0-alpha.17'
}

function glitchhubReleaseDownloadUrl(tag, asset) {
    var c = window.GLITCHHUB_RELEASE
    return 'https://github.com/' + c.repo + '/releases/download/' + tag + '/' + asset
}

function glitchhubFallbackDownloadUrls() {
    var c = window.GLITCHHUB_RELEASE
    var tag = c.fallbackTag || 'v3.0.0-alpha.17'
    return {
        tag: tag,
        windows: glitchhubReleaseDownloadUrl(tag, c.winAsset),
        mac: glitchhubReleaseDownloadUrl(tag, c.macAsset)
    }
}
