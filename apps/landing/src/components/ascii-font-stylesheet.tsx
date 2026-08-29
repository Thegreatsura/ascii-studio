/**
 * The ASCII renderer's font picker (see `ASCII_FONT_OPTIONS`) can pick any of
 * these families, so they have to be loaded before a frame is painted. That is
 * ~33 families of render-blocking CSS, which is why this lives on the routes
 * that actually run the renderer instead of in the root layout — the landing
 * page never uses any of them.
 *
 * React hoists these into <head>; `precedence` is what opts a <link rel=
 * "stylesheet"> into that hoisting.
 */
const ASCII_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Anonymous+Pro&family=Anton&family=Audiowide&family=Bebas+Neue&family=Chakra+Petch&family=Cinzel&family=Courier+Prime&family=Cutive+Mono&family=DM+Mono&family=DotGothic16&family=Fira+Code&family=Fira+Mono&family=IBM+Plex+Mono&family=Inconsolata&family=Inter&family=JetBrains+Mono&family=Josefin+Sans&family=Montserrat&family=Orbitron&family=Outfit&family=Overpass+Mono&family=Playfair+Display&family=Poppins&family=Press+Start+2P&family=Roboto+Mono&family=Saira+Stencil+One&family=Share+Tech+Mono&family=Silkscreen&family=Source+Code+Pro&family=Space+Mono&family=Syne&family=Teko&family=Ubuntu+Mono&family=VT323&display=swap";

export default function AsciiFontStylesheet() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={ASCII_FONTS_HREF} precedence="default" />
    </>
  );
}
