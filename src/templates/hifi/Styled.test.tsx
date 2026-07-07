import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Styled, plainText } from './Styled'

const html = (text: string) => renderToStaticMarkup(<Styled text={text} />)

describe('Styled', () => {
  it('passes plain copy through untouched', () => {
    expect(html('Braces before the first bell')).toBe('Braces before the first bell')
  })

  it('renders **bold** as .st-b', () => {
    expect(html('a **big** deal')).toBe('a <b class="st-b">big</b> deal')
  })

  it('renders *accent* as .st-a', () => {
    expect(html('A straighter *smile* for less')).toBe(
      'A straighter <span class="st-a">smile</span> for less',
    )
  })

  it('renders _italic_ and ~light~', () => {
    expect(html('_for you._')).toBe('<i class="st-i">for you.</i>')
    expect(html('~More confidence,~')).toBe('<span class="st-l">More confidence,</span>')
  })

  it('handles several spans in one string', () => {
    expect(html('*precisely planned* — **and built to still look** right')).toBe(
      '<span class="st-a">precisely planned</span> — <b class="st-b">and built to still look</b> right',
    )
  })

  it('renders unmatched/empty markers literally', () => {
    expect(html('5 * 3 = 15')).toBe('5 * 3 = 15')
    expect(html('a ** b')).toBe('a ** b')
    expect(html('snake_case_name')).toBe('snake<i class="st-i">case</i>name') // documented tradeoff: _..._ pairs match
  })

  it('plainText strips markers for fit math', () => {
    expect(plainText('*precisely planned* — **and built** _right_ ~now~')).toBe(
      'precisely planned — and built right now',
    )
    expect(plainText('no markers')).toBe('no markers')
  })
})
