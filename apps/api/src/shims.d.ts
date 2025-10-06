declare module "cors" {
  const anyExport: any;
  export default anyExport;
}

declare module "@react-pdf/renderer" {
  export const Document: any;
  export const Page: any;
  export const Text: any;
  export const View: any;
  export const StyleSheet: any;
  export const pdf: any;
}

declare module "react" {
  const React: any;
  export default React;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
