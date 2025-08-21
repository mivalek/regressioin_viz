import { FOV } from "./constants";

export function textToNumber(text) {
  return parseFloat(text.replace(" ", "").replace("−", "-"));
}

export function numberToText(number, id) {
  const sign =
    id === "b0"
      ? number < 0
        ? "&minus;"
        : ""
      : number < 0
      ? "&minus; "
      : "+ ";

  const val =
    number === 0 ? "0" : Math.abs(number).toFixed(id === "b3" ? 2 : 1);

  return sign + val;
}

export function updateFormulaValues(coords) {
  const values = { x1: coords.x, x2: -coords.z, y: coords.y };
  ["x1", "x2", "y"].forEach((param) => {
    const elems = formula.querySelectorAll(`.${param}val`);
    elems.forEach((e) => {
      const factor = param === "y" ? 10 : 1;
      const fixed = 1;
      return (e.innerHTML = `${values[param] < 0 ? "&minus;" : ""}${(
        factor * Math.abs(values[param])
      ).toFixed(fixed)}`);
    });
  });
}

export function getFov(aspect) {
  const out = FOV / aspect;
  return Math.max(Math.min(out, 75), 45);
}
