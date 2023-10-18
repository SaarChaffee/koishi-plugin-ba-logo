import path from 'path'
import { Context, Schema, Logger, h } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { Inputs, BALogoConfig, BALogoConstructor } from './types'

import type { BALogo as BALogoType } from './balogo'
declare const BALogo: typeof BALogoType

export const name = 'ba-logo'

const logger = new Logger('ba-logo')

export const using = ['puppeteer'] as const

export const Config: Schema<BALogoConfig> = Schema.object({
  fontSize: Schema.number().default(84),
  transparent: Schema.boolean().default(true),
})

function normalize(...file: string[]) {
  return path.posix.normalize(path.resolve(...file))
}

export function apply(ctx: Context) {
  ctx
    .command('ba <textL:string> <textR:string>')
    .option('fontSize', '-f <font:number> 字体大小')
    .option('transparent', '-t 透明背景')
    .option('haloX', '-x <x:number> 光环相对于中心水平偏移距离，默认 -15')
    .option('haloY', '-y <y:number> 光环相对于中心垂直偏移距离，默认 0')
    .action(async ({ session, options }, textL, textR) => {
      const page = await session.app.puppeteer.browser.newPage()
      await page.goto(normalize(__dirname, '../public/index.html'), { waitUntil: 'networkidle0' })

      await page.evaluate(async (inputs: Inputs, config: BALogoConstructor) => {
        const ba = new BALogo(config)
        await ba.draw(inputs)
      }, { textL, textR }, { options, config: ctx.config })

      const canvas = await page.$('#output')
      const im = await canvas.screenshot({ type: 'png' })
      await session.send(h.image(im, 'image/png'))
      await page.close()
    })
}
