export const SERVER: boolean = typeof process !== 'undefined' && process.server

export const CLIENT: boolean = typeof process !== 'undefined' && process.client

export const STATIC: boolean = typeof process !== 'undefined' && process.static

export const DEV: boolean = typeof process !== 'undefined' && process.dev
