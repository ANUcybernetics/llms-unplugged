import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LmTable from '../.vitepress/theme/components/LmTable.vue'

describe('LmTable', () => {
  it('renders a table', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['A', 'B'],
        data: [['1', '2']]
      }
    })
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('renders headers correctly', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['word 1', 'word 2', 'count'],
        data: []
      }
    })
    const headers = wrapper.findAll('th')
    expect(headers.length).toBe(3)
    expect(headers[0].text()).toBe('word 1')
    expect(headers[1].text()).toBe('word 2')
    expect(headers[2].text()).toBe('count')
  })

  it('renders data rows correctly', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['A', 'B'],
        data: [
          ['row1a', 'row1b'],
          ['row2a', 'row2b']
        ]
      }
    })
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[0].findAll('td')[0].text()).toBe('row1a')
    expect(rows[0].findAll('td')[1].text()).toBe('row1b')
  })

  it('converts numbers to tally marks', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['word', 'count'],
        data: [
          ['hello', 3],
          ['world', 7]
        ]
      }
    })
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].findAll('td')[1].text()).toBe('|||')
    expect(rows[1].findAll('td')[1].text()).toBe('卌 ||')
  })

  it('handles zero correctly', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['word', 'count'],
        data: [['empty', 0]]
      }
    })
    const cell = wrapper.find('tbody tr td:nth-child(2)')
    // Zero should render as empty/nbsp
    expect(cell.text().trim()).toBe('')
  })

  it('handles groups of 5 in tally marks', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['word', 'count'],
        data: [
          ['five', 5],
          ['ten', 10],
          ['twelve', 12]
        ]
      }
    })
    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].findAll('td')[1].text()).toBe('卌')
    expect(rows[1].findAll('td')[1].text()).toBe('卌 卌')
    expect(rows[2].findAll('td')[1].text()).toBe('卌 卌 ||')
  })

  it('renders empty table with no data', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['A', 'B', 'C'],
        data: []
      }
    })
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.findAll('th').length).toBe(3)
    expect(wrapper.findAll('tbody tr').length).toBe(0)
  })

  it('preserves string values as-is', () => {
    const wrapper = mount(LmTable, {
      props: {
        headers: ['word 1', 'word 2'],
        data: [['`see`', '`spot`']]
      }
    })
    const cells = wrapper.findAll('tbody tr td')
    expect(cells[0].text()).toBe('`see`')
    expect(cells[1].text()).toBe('`spot`')
  })
})
