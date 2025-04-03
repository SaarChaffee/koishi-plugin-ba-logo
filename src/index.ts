import { resolve } from 'path'
import { Context, Schema, h, Session } from 'koishi'
import { Inputs, BALogoConfig, BALogoConstructor, Results } from './types'

import type {} from 'koishi-plugin-fonts'
import type {} from 'koishi-plugin-puppeteer'
import type { BALogo as BALogoType } from './balogo'
declare const BALogo: typeof BALogoType

export const name = 'ba-logo'

export const inject = ['puppeteer', 'fonts']

export const Config: Schema<BALogoConfig> = Schema.object({
  fontSize: Schema.number().default(84),
  transparent: Schema.boolean().default(false),
  haloX: Schema.number().default(-18),
  haloY: Schema.number().default(0)
})

async function validator(texts: string[], session: Session): Promise<Results[]> {
  const results: Results[] = []
  for (const text of texts) {
    if (text === null || text === undefined || text === '') {
      results.push({ result: 'invalid', msg: '输入不完整' })
      return results
    }
    if (text.includes(' ')) {
      results.push({ result: 'text', msg: text })
      continue
    }
    const t = h.parse(text)[0]
    switch (t.type) {
      case 'at': {
        results.push({ result: 'at', msg: (await session.bot.getGuildMember(session.channelId, t.attrs.id)).user.name })
        break
      }
      case 'text': {
        results.push({ result: 'text', msg: t.attrs.content })
        break
      }
      default: {
        results.push({ result: 'invalid', msg: '输入无效' })
        return results
      }
    }
  }
  return results
}

export function apply(ctx: Context) {
  ctx.i18n.define('zh', require('./locales/zh-CN'))
  ctx.i18n.define('en', require('./locales/en-US'))
  ctx.i18n.define('jp', require('./locales/ja-JP'))

  ctx.fonts.register('GlowSansSC-Normal-Heavy_diff', resolve(__dirname, '../public/fonts/GlowSans'))
  ctx.fonts.register('RoGSanSrfStd-Bd', resolve(__dirname, '../public/fonts/RoGSans'))

  ctx
    .command('ba <textL:string> <textR:string>')
    .option('fontSize', '-f <font:number>')
    .option('transparent', '-t')
    .option('haloX', '-x <x:number>')
    .option('haloY', '-y <y:number>')
    .action(async ({ session, options }, textL, textR) => {
      const results = await validator([textL, textR], session)

      if (results.some(r => r.result === 'invalid')) {
        return session.text(results.find(r => r.result === 'invalid').msg)
      } else {
        const page = await ctx.puppeteer.pageWithFonts(
          ['RoGSanSrfStd-Bd', 'GlowSansSC-Normal-Heavy_diff'],
          resolve(__dirname, '../public/index.html'),
          { waitUntil: 'networkidle0' },
        )

        await page.evaluate(async (inputs: Inputs, config: BALogoConstructor) => {
          const ba = new BALogo(config)
          await ba.draw(inputs)
        }, { textL: results[0].msg, textR: results[1].msg }, { options, config: ctx.config })

        const canvas = await page.$('#output')
        const im = await canvas.screenshot({ type: 'png', omitBackground: true })
        await session.send(h.image(im, 'image/png'))
        await page.close()
      }
    })
}
