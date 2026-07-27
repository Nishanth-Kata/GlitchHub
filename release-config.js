/**
 * Public installer repo — landing download buttons and scripts.js read this.
 * CI copies stable asset names (GlitchHub-Setup-win.exe, GlitchHub-mac-arm64.dmg).
 */
window.GLITCHHUB_RELEASE = {
    repo: 'Nishanth-Kata/GlitchHub',
    winAsset: 'GlitchHub-Setup-win.exe',
    macAsset: 'GlitchHub-mac-arm64.dmg'
}

function glitchhubLatestDownloadUrl(asset) {
    var c = window.GLITCHHUB_RELEASE
    return (
        'https://github.com/' +
        c.repo +
        '/releases/latest/download/' +
        asset
    )
}
