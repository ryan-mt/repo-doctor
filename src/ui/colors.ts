const SUPPORTS_COLOR =
  process.stdout.isTTY === true &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== "dumb";

function wrap(open: number, close: number) {
  return (text: string): string => {
    if (!SUPPORTS_COLOR) return text;
    return `\x1b[${open}m${text}\x1b[${close}m`;
  };
}

export const dim = wrap(2, 22);
export const bold = wrap(1, 22);
export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const gray = wrap(90, 39);
