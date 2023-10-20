import path from 'path'
import { Context, Schema, Logger, h, Session } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { Inputs, BALogoConfig, BALogoConstructor, Results } from './types'

import type { BALogo as BALogoType } from './balogo'
declare const BALogo: typeof BALogoType

export const name = 'ba-logo'

const logger = new Logger('ba-logo')

export const using = ['puppeteer'] as const

export const Config: Schema<BALogoConfig> = Schema.object({
  fontSize: Schema.number().default(84),
  transparent: Schema.boolean().default(true),
  haloX: Schema.number().default(-18),
  haloY: Schema.number().default(0)
})

function normalize(...file: string[]) {
  return path.posix.normalize(path.resolve(...file))
}

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
  ctx
    .command('ba <textL:string> <textR:string>')
    .option('fontSize', '-f <font:number> 字体大小')
    .option('transparent', '-t 透明背景')
    .option('haloX', '-x <x:number> 光环相对于中心水平偏移距离，默认 -15')
    .option('haloY', '-y <y:number> 光环相对于中心垂直偏移距离，默认 0')
    .action(async ({ session, options }, textL, textR) => {

      const results = await validator([textL, textR], session)

      if (results.some(r => r.result === 'invalid')) {
        return session.text(results.find(r => r.result === 'invalid').msg)
      } else {
        const page = await session.app.puppeteer.browser.newPage()
        await page.goto(`file:///${normalize(__dirname, '../public/index.html')}`, { waitUntil: 'networkidle0' })
        await page.evaluate(async (inputs: Inputs, config: BALogoConstructor) => {
          const ba = new BALogo(config)
          await ba.draw(inputs)
        }, { textL: results[0].msg, textR: results[1].msg }, { options, config: ctx.config })

        const canvas = await page.$('#output')
        const im = await canvas.screenshot({ type: 'png' })
        await session.send(h.image(im, 'image/png'))
        await page.close()
      }
    })
}
