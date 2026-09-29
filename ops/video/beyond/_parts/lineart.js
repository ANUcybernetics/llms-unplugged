// A picture book's cover in line (STYLE.md): a white line rectangle on the
// desk, the title in the serif, and at most one line-art drawing. The face is
// filled with the desk, so a closed cover hides the page under it. Returns the
// cover's div (callers move, fade and fold it) with `border`, the rectangle to
// glint, and `art`, the drawing's paths.
//
// Used by `training-grid`, `training-ledger`, `overview` and
// `making-things-up`.
export function lineCover(
  parent,
  title,
  { x = 0, y = 0, w = 520, h = 640, sub = "", art = "magpie" } = {},
) {
  const K = KIT;
  const d = K.el(
    "div",
    {
      class: "layer",
      style: {
        width: `${w}px`,
        height: `${h}px`,
        background: "var(--desk)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: `${h * 0.12}px`,
        fontFamily: "var(--font-tok)",
        color: "var(--text)",
      },
    },
    parent,
  );
  const s = K.svg(
    "svg",
    {
      width: w,
      height: h,
      viewBox: `0 0 ${w} ${h}`,
      style: "position: absolute; left: 0; top: 0; overflow: visible",
    },
    d,
  );
  const border = K.svg("rect", { x: 1, y: 1, width: w - 2, height: h - 2, class: "line" }, s);
  K.el(
    "div",
    {
      text: title,
      style: { fontSize: `${w * 0.15}px`, fontWeight: 600, lineHeight: 1.1, textAlign: "center" },
    },
    d,
  );
  if (sub)
    K.el(
      "div",
      {
        text: sub,
        style: {
          fontSize: `${w * 0.065}px`,
          fontStyle: "italic",
          marginTop: `${w * 0.05}px`,
          color: "var(--text-2)",
        },
      },
      d,
    );
  let paths = [];
  if (art) {
    const ah = h * 0.48,
      aw = w * 0.6;
    const o = K.outline(d, art, { x: (w - aw) / 2, y: h * 0.4, w: aw, h: ah });
    paths = o.paths;
  }
  K.set(d, { x, y });
  d.border = border;
  d.art = paths;
  return d;
}
