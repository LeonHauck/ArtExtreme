import { describe, expect, it } from 'vitest'
import { isChunkError } from './chunkReload'

describe('isChunkError', () => {
  it('reconhece "arquivo da versão antiga sumiu" em cada navegador', () => {
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Reports-abc.js'))).toBe(true) // Chrome/Android
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true) // Safari/iPhone
    expect(isChunkError(new TypeError('error loading dynamically imported module'))).toBe(true) // Firefox
    expect(isChunkError(new Error('Unable to preload CSS for /assets/index.css'))).toBe(true)
  })
  it('não confunde com outros erros', () => {
    expect(isChunkError(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false)
    expect(isChunkError(new Error('Failed to fetch'))).toBe(false)
  })
})
