import { Inputs, BALogoConstructor, GraphOffset } from './types'


export class BALogo {
  private graphOffset: GraphOffset
  private paddingX = 10
  private horizontalTilt = -0.4
  private textBaseLine = 0.68
  private fontSize: number
  private canvasHeight = 250
  private canvasWidth = 900
  private canvasWidthL = this.canvasWidth / 2
  private canvasWidthR = this.canvasWidth / 2
  private textWidthL = 0
  private textWidthR = 0
  private textMetricsL: TextMetrics | null = null
  private textMetricsR: TextMetrics | null = null
  private transparentBg: boolean
  private font: string
  private fontFamily = 'RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  private hollowPath = [
    [284, 136],
    [321, 153],
    [159, 410],
    [148, 403],
  ]

  constructor({ options, config }: BALogoConstructor) {
    this.fontSize = options?.fontSize || config.fontSize
    this.transparentBg = options?.transparent ? !config.transparent : config.transparent
    this.graphOffset = {
      X: options?.haloX || config.haloX,
      Y: options?.haloY || config.haloY
    }
    this.font = `${this.fontSize}px ${this.fontFamily}`
  }

  async loadFonts(text: string) {
    await document.fonts.load(
      this.font,
      text
    )
  }

  async draw({ textL, textR }: Inputs) {
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    const halo = document.querySelector('#halo') as HTMLImageElement
    const cross = document.querySelector('#cross') as HTMLImageElement
    await this.loadFonts(textL + textR)

    // Initial
    canvas.height = this.canvasHeight
    canvas.width = this.canvasWidth
    ctx.font = this.font
    this.textMetricsL = ctx.measureText(textL)
    this.textMetricsR = ctx.measureText(textR)

    // set width
    this.textWidthL =
      this.textMetricsL!.width -
      (this.textBaseLine * this.canvasHeight + this.textMetricsL!.fontBoundingBoxDescent) * this.horizontalTilt
    this.textWidthR =
      this.textMetricsR!.width +
      (this.textBaseLine * this.canvasHeight - this.textMetricsR!.fontBoundingBoxAscent) * this.horizontalTilt
    // extend canvas
    if (this.textWidthL + this.paddingX > this.canvasWidth / 2) {
      this.canvasWidthL = this.textWidthL + this.paddingX
    } else {
      this.canvasWidthL = this.canvasWidth / 2
    }
    if (this.textWidthR + this.paddingX > this.canvasWidth / 2) {
      this.canvasWidthR = this.textWidthR + this.paddingX
    } else {
      this.canvasWidthR = this.canvasWidth / 2
    }
    canvas.width = this.canvasWidthL + this.canvasWidthR
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // background
    if (!this.transparentBg) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Text L
    ctx.font = this.font
    ctx.fillStyle = '#128AFA'
    ctx.textAlign = 'end'
    ctx.setTransform(1, 0, this.horizontalTilt, 1, 0, 0)
    ctx.fillText(textL, this.canvasWidthL, canvas.height * this.textBaseLine)
    ctx.resetTransform()

    // Halo
    ctx.drawImage(
      halo,
      this.canvasWidthL - canvas.height / 2 + this.graphOffset.X,
      this.graphOffset.Y,
      this.canvasHeight,
      this.canvasHeight
    )

    // Text R
    ctx.fillStyle = '#2B2B2B'
    ctx.textAlign = 'start'
    if (this.transparentBg) {
      ctx.globalCompositeOperation = 'destination-out'
    }
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 12
    ctx.setTransform(1, 0, this.horizontalTilt, 1, 0, 0)
    ctx.strokeText(textR, this.canvasWidthL, canvas.height * this.textBaseLine)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillText(textR, this.canvasWidthL, canvas.height * this.textBaseLine)
    ctx.resetTransform()

    // Cross background
    const graph = {
      X: this.canvasWidthL - canvas.height / 2 + this.graphOffset.X,
      Y: this.graphOffset.Y,
    }
    ctx.beginPath()
    ctx.moveTo(graph.X + (this.hollowPath[0][0] / 500) * this.canvasHeight, graph.Y + (this.hollowPath[0][1] / 500) * this.canvasHeight)
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(graph.X + (this.hollowPath[i][0] / 500) * this.canvasHeight, graph.Y + (this.hollowPath[i][1] / 500) * this.canvasHeight)
    }
    ctx.closePath()
    if (this.transparentBg) {
      ctx.globalCompositeOperation = 'destination-out'
    }
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Cross
    ctx.drawImage(
      cross,
      this.canvasWidthL - canvas.height / 2 + this.graphOffset.X,
      this.graphOffset.Y,
      this.canvasHeight,
      this.canvasHeight
    )

    // output
    let outputCanvas: HTMLCanvasElement = document.querySelector('#output')
    outputCanvas.width = this.textWidthL + this.textWidthR + this.paddingX * 2
    outputCanvas.height = canvas.height
    const ctx2 = outputCanvas.getContext('2d')
    if (
      this.textWidthL + this.paddingX < this.canvasWidth / 2 &&
      this.textWidthR + this.paddingX < this.canvasWidth / 2
    ) {
      ctx2.drawImage(
        canvas,
        this.canvasWidth / 2 - this.textWidthL - this.paddingX,
        0,
        this.textWidthL + this.textWidthR + this.paddingX * 2,
        canvas.height,
        0,
        0,
        this.textWidthL + this.textWidthR + this.paddingX * 2,
        canvas.height
      )
    } else if (this.textWidthL + this.paddingX >= this.canvasWidth / 2) {
      ctx2.drawImage(
        canvas,
        0,
        0,
        this.textWidthL + this.textWidthR + this.paddingX * 2,
        canvas.height,
        0,
        0,
        this.textWidthL + this.textWidthR + this.paddingX * 2,
        canvas.height
      )
    } else if (this.textWidthR + this.paddingX >= this.canvasWidth / 2) {
      ctx2.drawImage(
        canvas,
        this.canvasWidth / 2 - this.textWidthL - this.paddingX,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      )
    } else {
      ctx2.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      )
    }
  }
}
