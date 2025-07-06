declare module 'color-contrast-checker' {
  export default class ColorContrastChecker {
    constructor();
    isLevelAA(foreground: string, background: string, fontSize?: number): boolean;
    isLevelAAA(foreground: string, background: string, fontSize?: number): boolean;
    contrastRatio(foreground: string, background: string): number;
  }
}
