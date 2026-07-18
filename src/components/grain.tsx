/** Fixed film-grain overlay driven by an SVG feTurbulence filter. Pure decoration. */
export function Grain() {
  return (
    <>
      <svg id="grain-svg" aria-hidden="true">
        <defs>
          <filter
            id="grain-filter"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.8}
              numOctaves={3}
              seed={2}
              stitchTiles="stitch"
              result="noise"
            />
            <feComponentTransfer in="noise" result="contrastNoise">
              <feFuncR type="linear" slope={1.5} intercept={-0.25} />
              <feFuncG type="linear" slope={1.5} intercept={-0.25} />
              <feFuncB type="linear" slope={1.5} intercept={-0.25} />
            </feComponentTransfer>
            <feColorMatrix in="contrastNoise" type="saturate" values="0" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="soft-light" result="blended" />
            <feComponentTransfer in="blended">
              <feFuncA type="linear" slope={0.6} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div id="grain" aria-hidden="true" />
    </>
  );
}
