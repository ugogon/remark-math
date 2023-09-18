import assert from 'node:assert/strict'
import test from 'node:test'
import katex from 'katex'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import remarkHtml from 'remark-html'
import remarkMath from '../remark-math/index.js'
import remarkHtmlKatex from './index.js'

test('remark-html-katex', async function (t) {
  await t.test('should transform math with katex', async function () {
    assert.deepEqual(
      unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHtmlKatex)
        // @ts-expect-error: to do: remove when `remark-html` is released.
        .use(remarkHtml, {sanitize: false})
        .processSync(
          [
            'Inline math $\\alpha$.',
            '',
            'Block math:',
            '',
            '$$',
            '\\gamma',
            '$$'
          ].join('\n')
        )
        .toString(),
      unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeStringify)
        .processSync(
          [
            '<p>Inline math <code class="language-math math-inline">' +
              katex.renderToString('\\alpha') +
              '</code>.</p>',
            '<p>Block math:</p>',
            '<pre><code class="language-math math-display">' +
              katex.renderToString('\\gamma', {displayMode: true}) +
              '</code></pre>',
            ''
          ].join('\n')
        )
        .toString()
    )
  })

  await t.test('should support `macros`', async function () {
    const macros = {'\\RR': '\\mathbb{R}'}

    assert.deepEqual(
      unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHtmlKatex, {macros})
        // @ts-expect-error: to do: remove when `remark-html` is released.
        .use(remarkHtml, {sanitize: false})
        .processSync('$\\RR$')
        .toString(),
      unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeStringify)
        .processSync(
          '<p><code class="language-math math-inline">' +
            katex.renderToString('\\RR', {macros}) +
            '</code></p>\n'
        )
        .toString()
    )
  })

  await t.test('should support `errorColor`', async function () {
    assert.deepEqual(
      unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHtmlKatex, {errorColor: 'orange'})
        // @ts-expect-error: to do: remove when `remark-html` is released.
        .use(remarkHtml, {sanitize: false})
        .processSync('$\\alpa$')
        .toString(),
      unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeStringify)
        .processSync(
          '<p><code class="language-math math-inline">' +
            katex.renderToString('\\alpa', {
              throwOnError: false,
              errorColor: 'orange'
            }) +
            '</code></p>\n'
        )
        .toString()
    )
  })

  await t.test('should create a message for errors', async function () {
    assert.deepEqual(
      unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHtmlKatex)
        // @ts-expect-error: to do: remove when `remark-html` is released.
        .use(remarkHtml, {sanitize: false})
        .processSync('Lorem\n$\\alpa$')
        .messages.map(String),
      [
        '2:1-2:8: KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲'
      ]
    )
  })

  await t.test(
    'should throw an error if `throwOnError: true`',
    async function () {
      try {
        unified()
          .use(remarkParse)
          .use(remarkMath)
          .use(remarkHtmlKatex, {throwOnError: true})
          // @ts-expect-error: to do: remove when `remark-html` is released.
          .use(remarkHtml, {sanitize: false})
          .processSync('Lorem\n$\\alpa$')
      } catch (error_) {
        const error = /** @type {Error} */ (error_)
        assert.equal(
          error.message,
          'KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲'
        )
      }
    }
  )

  await t.test('should support `strict: ignore`', async function () {
    assert.deepEqual(
      unified()
        .use(remarkParse)
        .use(remarkMath)
        .use(remarkHtmlKatex, {errorColor: 'orange', strict: 'ignore'})
        // @ts-expect-error: to do: remove when `remark-html` is released.
        .use(remarkHtml, {sanitize: false})
        .processSync('$ê&$')
        .toString(),
      unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeStringify)
        .processSync(
          '<p><code class="language-math math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Expected \'EOF\', got \'&\' at position 2: ê&̲" style="color:orange">ê&amp;</span></code></p>\n'
        )
        .toString()
    )
  })

  await t.test('should support generated nodes', async function () {
    const pipeline = unified()
      .use(remarkHtmlKatex, {errorColor: 'orange', strict: 'ignore'})
      // @ts-expect-error: to do: remove when `remark-html` is released.
      .use(remarkHtml, {sanitize: false})

    assert.deepEqual(
      pipeline.stringify(
        pipeline.runSync({
          type: 'root',
          children: [{type: 'inlineMath', value: '\\alpha'}]
        })
      ),
      '<div>' + katex.renderToString('\\alpha') + '</div>\n'
    )
  })
})
