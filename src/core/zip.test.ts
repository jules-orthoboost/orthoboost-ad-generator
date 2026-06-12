import { describe, it, expect } from 'vitest'
import { makeZip, crc32 } from './zip'

describe('crc32', () => {
  it('matches the known vector for "123456789"', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })
})

describe('makeZip', () => {
  it('produces a valid single-file archive', () => {
    const data = new TextEncoder().encode('<html>hi</html>')
    const zip = makeZip([{ name: 'index.html', data }])
    // local file header signature PK\x03\x04
    expect([...zip.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // end-of-central-directory signature PK\x05\x06 present
    const tail = [...zip.slice(-22, -18)]
    expect(tail).toEqual([0x50, 0x4b, 0x05, 0x06])
    // stored payload present verbatim
    const text = new TextDecoder().decode(zip)
    expect(text).toContain('<html>hi</html>')
    expect(text).toContain('index.html')
  })
})
