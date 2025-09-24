declare namespace NodeJS {
  interface Global {}
}

declare namespace JSX {
  interface IntrinsicElements {
    [key: string]: any
  }
}

declare const describe: any
declare const it: any
declare const test: any
declare const expect: any
declare const beforeEach: any
declare const vi: any
