export interface Inputs {
  textL: string
  textR: string
}

export interface BALogoConstructor {
  options: Options
  config: BALogoConfig
}

export interface Options {
  fontSize?: number
  transparent?: boolean
  haloX?: number
  haloY?: number
}

export interface BALogoConfig {
  fontSize: number
  transparent: boolean
  haloX: number
  haloY: number
}

export interface GraphOffset {
  X: number
  Y: number
}

export interface Results{
  result: 'at' | 'text' | 'invalid'
  msg: string
}